# AI advisory review for Submission Review Issues

Research date: 2026-08-31

## Recommendation

Use one synchronous, server-side call to OpenAI's Responses API with `gpt-5-mini` (or a pinned snapshot), after a Submission is persisted and its Review Issue exists. Keep the result advisory: the model may flag correctness, clarity, attribution, fit, or safety concerns, but it cannot change Supabase status, add/remove `needs-review`, close an Issue, edit a Question Revision, or publish an Interview Question.

This is the smallest fit for the current architecture: Supabase Edge Functions are Deno/TypeScript and explicitly support small AI inference and third-party API calls; Supabase also documents OpenAI from an Edge Function. The call can be made with `fetch`, so no new dependency is required. [Supabase Edge Functions](https://supabase.com/docs/guides/functions), [Supabase OpenAI example](https://supabase.com/docs/guides/ai/examples/openai)

## Provider comparison

| Option | Edge/API fit | Structured advisory output | Current published price (USD / 1M tokens) | Trade-off |
| --- | --- | --- | --- | --- |
| OpenAI Responses + `gpt-5-mini` | Direct HTTPS from Deno; Responses endpoint is supported | Structured Outputs with JSON Schema; refusal and incomplete-output paths must be handled | $0.25 input / $2 output; cached input $0.025 | Best first release: existing Supabase guidance, simple `fetch`, cheap, and strong schema support. [Model](https://developers.openai.com/api/docs/models/gpt-5-mini), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) |
| Anthropic Messages + Claude Haiku 4.5 | Direct HTTPS from Deno; stateless Messages API | `output_config.format` JSON Schema or strict tool use | $1 input / $5 output | Good alternative, but adds a second provider contract; official SDK retries are not useful if avoiding a dependency, so REST retry logic is needed. [Messages](https://platform.claude.com/docs/en/api/http/beta/messages/create), [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) |
| Google Gemini `gemini-3.5-flash-lite` | Direct HTTPS `generateContent` from Deno with an API key header | JSON Schema via `responseMimeType`/`responseJsonSchema` | $0.30 input / $2.50 output | Lowest operational friction after OpenAI, but free-tier content may be used to improve Google products; paid quota is required for production privacy. [API](https://ai.google.dev/api), [Structured output](https://ai.google.dev/gemini-api/docs/generate-content/structured-output), [Pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Supabase built-in AI / Ollama / Llamafile | Native Edge API exists, but hosted LLM access is still being rolled out; self-managed runtime required in the documented path | Depends on the local model | Infrastructure cost is not comparable | Do not choose for v1: it creates model hosting/operations work and does not provide a ready production endpoint. [Supabase AI models](https://supabase.com/docs/guides/functions/ai-models) |

Price estimate for orientation only: at 4,000 input + 600 output tokens, one `gpt-5-mini` review is about $0.0022; Haiku 4.5 about $0.007; Gemini Flash-Lite about $0.0027. Actual cost depends on tokenization, retries, and output length. Set a short input/output cap and a provider spend alert.

## Data and prompt boundary

Send only a normalized, bounded review envelope:

```json
{
  "track": "flutter",
  "topics": ["dart"],
  "difficulty": "mid",
  "question": "...",
  "short_answer": "...",
  "explanation": "...",
  "code_example": "...",
  "common_mistakes": ["..."],
  "follow_ups": ["..."],
  "sources": ["https://..."],
  "submission_id": "opaque-id"
}
```

Do not send the contributor display name, Clerk user ID, email, auth headers, Supabase keys, GitHub token/private key, private Account data, or Issue conversation history. Apply length limits already enforced by Submission validation, and add a small server-side PII scrub for obvious emails/phone numbers before forwarding free text. Preserve public source domains/URLs only as needed to assess attribution. Treat every Submission field as untrusted quoted data; the system instruction must say that the content is not an instruction and that the model has no tools, network access, or publication authority.

Use a fixed versioned system prompt and a strict schema such as:

```json
{
  "flags": [
    {"criterion":"correctness|clarity|attribution|fit|safety", "severity":"low|medium|high", "rationale":"...", "evidence":"..."}
  ],
  "summary": "...",
  "needs_human_attention": true,
  "confidence": 0.0
}
```

Reject schema-invalid, overlong, refused, or truncated output. Never let a model-generated `recommendedAction` map directly to `changes_requested`, `rejected`, or `published`.

OpenAI's business/API terms say customer content is not used to improve services unless explicitly agreed, while API inputs/outputs may be retained for up to 30 days by default; eligible endpoints can use approved zero-data-retention controls. Gemini's unpaid services may use content for product improvement and human review, whereas paid Gemini API quota says prompts/responses are not used for product improvement. Anthropic's commercial terms say it may not train models on Customer Content. These policies do not remove the need to minimize/redact data. [OpenAI privacy](https://openai.com/enterprise-privacy/), [OpenAI Services Agreement](https://openai.com/policies/services-agreement/), [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data), [Google Gemini terms](https://ai.google.dev/gemini-api/terms), [Anthropic commercial terms](https://www.anthropic.com/legal/commercial-terms)

## Runtime, failure, and retry contract

Do not put the model call in the browser or make it a prerequisite for Submission persistence. Persist the Submission first, then run the advisory call. A synchronous first release can return `ai_pending`/`ai_failed` without changing the Review Issue's `needs-review` state; a later moderator refresh or retry can add the comment. Supabase hosted Edge Functions have a 150-second request idle timeout (and a 150/400-second wall-clock limit depending on plan), so set an upstream timeout well below that (for example, 20–30 seconds) and keep output bounded. [Supabase limits](https://supabase.com/docs/guides/functions/limits)

Retry only transient provider/network failures (`408`, `429`, `500`, `502`, `503`, `504`) with at most two attempts, exponential backoff plus jitter, and a total retry budget below the function timeout. Do not retry authentication, billing/quota, malformed-request, safety refusal, or schema failures. OpenAI recommends honoring `Retry-After` and bounding attempts; Anthropic documents exponential backoff for 5xx and typed 429/529 errors; Gemini documents backoff for 429/503 and not retrying 4xx client errors. [OpenAI rate limits](https://developers.openai.com/api/docs/guides/rate-limits), [Anthropic errors](https://platform.claude.com/docs/en/api/errors), [Gemini troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting)

Idempotency is required because the provider call and GitHub comment are separate side effects. Identify the advisory with `submission-id + revision_number + prompt_version + provider/model`; before posting, search the Issue comments or store the advisory key in Supabase. Post one bounded Markdown comment with a machine-readable marker, for example `<!-- ai-advisory:v1 submission=<id> revision=1 -->`, followed by model, timestamp, flags, summary, and an explicit “advisory only—Moderator decision required” notice. If commenting fails after a successful model response, retain the result/status for retry; never rerun the model blindly and create duplicate comments.

## GitHub boundary

Keep the current labels (`community-submission`, `needs-review`) unchanged until a Moderator decision. The current function already creates the Issue with those labels, and the repository contract says closing an Issue does not publish content. No new AI label is needed for v1. If the product later standardizes on `suggested-question`, treat that as a label rename/migration decision, not an AI side effect.

The existing GitHub App installation token remains server-only. GitHub's create-issue, issue-comment, and update-issue APIs accept installation tokens with repository `Issues: write`; this covers creating the Review Issue and posting the advisory comment while avoiding repository contents/workflow permissions. [Create an issue](https://docs.github.com/en/rest/issues/issues#create-an-issue), [Create an issue comment](https://docs.github.com/en/rest/issues/comments#create-an-issue-comment), [GitHub App installation tokens](https://docs.github.com/en/rest/apps/apps#create-an-installation-access-token-for-an-app)

## Decision

Adopt OpenAI Responses + `gpt-5-mini`, server-side, one bounded call per Submission Revision, strict JSON output, no tools, no autonomous status/label/publication changes, and one idempotent GitHub Issue comment. Defer provider fallback, multi-model voting, embeddings/RAG, asynchronous queues, and self-hosted models until measured false positives, latency, outage frequency, or volume justifies them.

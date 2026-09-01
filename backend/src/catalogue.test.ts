import assert from "node:assert/strict";
import test from "node:test";

import { createSupabaseCatalogueStore, CatalogueError } from "./catalogue.ts";

test("catalogue adapter returns published bilingual questions and omits invalid follow-ups", async () => {
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    if (url.includes("slug=eq.source")) return Response.json([{ id: "q1", slug: "source", track_id: "flutter", difficulty: "Junior", published_revision_id: "r1" }]);
    if (url.includes("question_revisions?")) return Response.json([{ id: "r1", question_id: "q1", reviewed_at: "2026-08-30" }]);
    if (url.includes("question_revision_locales?select=locale")) return Response.json(["ar", "en"].map((locale) => ({ locale, question: `${locale} source`, short_answer: "short", explanation: "explanation", common_mistakes: [], follow_up_questions: [], sources: [{ title: "Docs", url: "https://dart.dev/docs" }] })));
    if (url.includes("question_follow_ups?")) return Response.json([{ target_question_id: "q2", position: 1 }, { target_question_id: "missing", position: 2 }]);
    if (url.includes("interview_questions?select=id,slug,track_id")) return Response.json([{ id: "q2", slug: "target", track_id: "flutter", published_revision_id: "r2" }]);
    if (url.includes("question_revision_locales?select=revision_id")) return Response.json([{ revision_id: "r2", locale: "en", question: "target" }, { revision_id: "r2", locale: "ar", question: "الهدف" }]);
    if (url.includes("question_topics?")) return Response.json([{ topic_id: "dart" }]);
    if (url.includes("topic_locales?")) return Response.json([{ topic_id: "dart", name: "Dart" }]);
    return Response.json([], { status: 404 });
  };
  const question = await createSupabaseCatalogueStore({ url: "https://db.example", serviceRoleKey: "service-secret", fetchImpl }).getQuestion("source", "en");
  assert.equal(question.translations.en.question, "en source");
  assert.deepEqual(question.translations.en.followUpQuestionRefs?.map(({ slug }) => slug), ["target"]);
});

test("catalogue adapter exposes stable not-found and unavailable errors", async () => {
  const missing = createSupabaseCatalogueStore({ url: "https://db.example", serviceRoleKey: "secret", fetchImpl: async () => Response.json([]) });
  await assert.rejects(missing.getQuestion("missing", "en"), (error: unknown) => error instanceof CatalogueError && error.code === "question_not_found" && error.status === 404);
  const unavailable = createSupabaseCatalogueStore({ url: "https://db.example", serviceRoleKey: "secret", fetchImpl: async () => new Response("", { status: 503 }) });
  await assert.rejects(unavailable.getQuestion("source", "en"), (error: unknown) => error instanceof CatalogueError && error.status === 503);
});

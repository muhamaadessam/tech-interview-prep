import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable";

test("database questions resolve ordered follow-up relations and ignore missing targets", async () => {
  const { loadDatabaseQuestion } = await import("./database.ts");
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    if (url.includes("slug=eq.source")) return Response.json([{ id: "dart-001", slug: "source", track_id: "flutter", difficulty: "Junior", published_revision_id: "revision-1" }]);
    if (url.includes("question_revisions?")) return Response.json([{ id: "revision-1", question_id: "dart-001", reviewed_at: "2026-08-30" }]);
    if (url.includes("question_revision_locales?select=locale")) return Response.json(["ar", "en"].map((locale) => ({ locale, question: `${locale} source`, short_answer: "short", explanation: "explanation", common_mistakes: [], follow_up_questions: [], sources: [{ title: "Docs", url: "https://dart.dev/docs" }] })));
    if (url.includes("question_follow_ups?")) return Response.json([{ target_question_id: "dart-006", position: 1 }, { target_question_id: "missing", position: 2 }]);
    if (url.includes("interview_questions?select=id,slug,track_id,published_revision_id")) return Response.json([{ id: "dart-006", slug: "target", track_id: "flutter", published_revision_id: "revision-6" }]);
    if (url.includes("question_revision_locales?select=revision_id")) return Response.json([{ revision_id: "revision-6", locale: "en", question: "target question" }, { revision_id: "revision-6", locale: "ar", question: "السؤال الهدف" }]);
    if (url.includes("question_topics?")) return Response.json([{ topic_id: "dart" }]);
    if (url.includes("topic_locales?")) return Response.json([{ topic_id: "dart", name: "Dart" }]);
    return Response.json([], { status: 404 });
  };
  const question = await loadDatabaseQuestion("source", "en", fetchImpl);
  assert.deepEqual(question.translations.en.followUpQuestionRefs?.map((ref) => ref.slug), ["target"]);
  assert.equal(question.translations.en.followUpQuestionRefs?.[0]?.href, "/questions/view?slug=target&track=flutter");
});

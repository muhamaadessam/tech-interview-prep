import assert from "node:assert/strict";
import test from "node:test";

import { DatabaseQuestionNotFound, loadDatabaseQuestion } from "./database.ts";

process.env.NEXT_PUBLIC_API_URL = "https://api.example";

test("database question reads use the Node catalogue", async () => {
  const question = await loadDatabaseQuestion("source", "ar", async (input) => {
    assert.equal(String(input), "https://api.example/v1/questions/source?locale=ar");
    return Response.json({ id: "dart-001", slug: "source", trackId: "flutter", topicIds: ["dart"], topicNames: ["Dart"], difficulty: "Junior", lastReviewedAt: "2026-08-30", translations: { ar: {}, en: {} } });
  });
  assert.equal(question.slug, "source");
});

test("database question preserves the not-found interface", async () => {
  await assert.rejects(loadDatabaseQuestion("missing", "en", async () => Response.json({ error: "question_not_found" }, { status: 404 })), DatabaseQuestionNotFound);
});

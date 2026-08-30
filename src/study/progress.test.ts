import assert from "node:assert/strict";
import test from "node:test";

import {
  accountStorageKey,
  anonymousStorageKey,
  getAnonymousStudyOwner,
  getSavedQuestions,
  resetSavedQuestions,
  saveQuestionState,
  setAnonymousStudyOwner,
  setActiveStudyAccount,
} from "./progress.ts";
import { mergeSavedQuestions, syncStudyProgress } from "./cloud-progress.ts";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

test("question progress and favorites persist independently and reset together", () => {
  const storage = memoryStorage();

  saveQuestionState(storage, "dart-001", { progress: "reviewing" });
  saveQuestionState(storage, "dart-001", { favorite: true });
  assert.deepEqual(getSavedQuestions(storage), {
    "dart-001": { progress: "reviewing", favorite: true },
  });

  saveQuestionState(storage, "dart-001", { progress: "mastered" });
  assert.deepEqual(getSavedQuestions(storage)["dart-001"], {
    progress: "mastered",
    favorite: true,
  });

  resetSavedQuestions(storage);
  assert.deepEqual(getSavedQuestions(storage), {});
});

test("invalid local study data is ignored", () => {
  const storage = memoryStorage();
  storage.setItem("tech-interview-prep:questions:v1", "not json");
  assert.deepEqual(getSavedQuestions(storage), {});

  storage.setItem("tech-interview-prep:questions:v1", JSON.stringify({
    "dart-001": { progress: "finished", favorite: "yes" },
  }));
  assert.deepEqual(getSavedQuestions(storage), {});
});

test("cloud merge keeps the strongest progress and ORs favorites", () => {
  assert.deepEqual(
    mergeSavedQuestions(
      {
        "dart-001": { progress: "reviewing", favorite: false },
        "dart-002": { progress: "mastered", favorite: false },
      },
      {
        "dart-001": { progress: "mastered", favorite: true },
        "dart-002": { progress: "reviewing", favorite: true },
        "dart-003": { progress: "not-started", favorite: true },
      },
    ),
    {
      "dart-001": { progress: "mastered", favorite: true },
      "dart-002": { progress: "mastered", favorite: true },
      "dart-003": { progress: "not-started", favorite: true },
    },
  );
});

test("cloud sync leaves local state untouched when no authenticated token is available", async () => {
  const storage = memoryStorage();
  saveQuestionState(storage, "dart-001", { progress: "reviewing" });
  const before = getSavedQuestions(storage);
  const result = await syncStudyProgress({
    storage,
    userId: "user_test",
    getToken: async () => null,
  });
  assert.equal(result.synced, false);
  assert.deepEqual(getSavedQuestions(storage), before);
});

test("account-scoped cache does not leak progress between accounts", () => {
  const storage = memoryStorage();
  setActiveStudyAccount(storage, "user_a");
  saveQuestionState(storage, "dart-001", { progress: "mastered" });
  setActiveStudyAccount(storage, null);
  saveQuestionState(storage, "dart-002", { favorite: true });
  setActiveStudyAccount(storage, "user_b");

  assert.deepEqual(getSavedQuestions(storage), {});
  assert.equal(getSavedQuestions(storage, accountStorageKey("user_a"))["dart-001"].progress, "mastered");
  assert.equal(getSavedQuestions(storage, anonymousStorageKey)["dart-002"].favorite, true);
});

test("anonymous cache ownership survives retries and clears on explicit reset", () => {
  const storage = memoryStorage();
  saveQuestionState(storage, "dart-001", { progress: "reviewing" }, anonymousStorageKey);
  setAnonymousStudyOwner(storage, "user_a");
  assert.equal(getAnonymousStudyOwner(storage), "user_a");
  resetSavedQuestions(storage, anonymousStorageKey);
  assert.equal(getAnonymousStudyOwner(storage), null);
});

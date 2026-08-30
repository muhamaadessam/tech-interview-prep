import assert from "node:assert/strict";
import test from "node:test";

import {
  getSavedQuestions,
  resetSavedQuestions,
  saveQuestionState,
} from "./progress.ts";

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

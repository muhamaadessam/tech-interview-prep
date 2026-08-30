import assert from "node:assert/strict";
import test from "node:test";

import {
  getStudyData,
  resetStudyData,
  saveQuestionStudy,
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

  saveQuestionStudy(storage, "dart-001", { progress: "reviewing" });
  saveQuestionStudy(storage, "dart-001", { favorite: true });
  assert.deepEqual(getStudyData(storage), {
    "dart-001": { progress: "reviewing", favorite: true },
  });

  saveQuestionStudy(storage, "dart-001", { progress: "mastered" });
  assert.deepEqual(getStudyData(storage)["dart-001"], {
    progress: "mastered",
    favorite: true,
  });

  resetStudyData(storage);
  assert.deepEqual(getStudyData(storage), {});
});

test("invalid local study data is ignored", () => {
  const storage = memoryStorage();
  storage.setItem("tech-interview-prep:study:v1", "not json");
  assert.deepEqual(getStudyData(storage), {});

  storage.setItem("tech-interview-prep:study:v1", JSON.stringify({
    "dart-001": { progress: "finished", favorite: "yes" },
  }));
  assert.deepEqual(getStudyData(storage), {});
});

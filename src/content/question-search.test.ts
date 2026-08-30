import assert from "node:assert/strict";
import test from "node:test";

import { questions, topics } from "./questions.ts";
import { filterQuestions, toSearchParams, type LibraryFilters } from "./question-search.ts";

const emptyFilters: LibraryFilters = {
  search: "",
  topic: "",
  difficulty: "",
  progress: "",
  favoriteOnly: false,
};

test("library search matches question text and short answers", () => {
  assert.equal(filterQuestions(questions, { ...emptyFilters, search: "وقت الترجمة" }, {}, topics).length, 1);
  assert.equal(filterQuestions(questions, { ...emptyFilters, search: "final" }, {}, topics).length, 1);
  assert.equal(filterQuestions(questions, { ...emptyFilters, search: "not found" }, {}, topics).length, 0);
});

test("library filters combine with local progress and favorite state", () => {
  const saved = { "dart-001": { progress: "mastered" as const, favorite: true } };
  const filters = { ...emptyFilters, topic: "dart", difficulty: "Junior" as const, progress: "mastered" as const, favoriteOnly: true };

  assert.equal(filterQuestions(questions, filters, saved, topics).length, 1);
  assert.equal(filterQuestions(questions, { ...filters, progress: "reviewing" }, saved, topics).length, 0);
});

test("shareable query params omit personal progress and favorites", () => {
  const params = toSearchParams({ ...emptyFilters, search: "final", topic: "dart", difficulty: "Junior", progress: "mastered", favoriteOnly: true });
  assert.equal(params.toString(), "search=final&topic=dart&difficulty=Junior");
});

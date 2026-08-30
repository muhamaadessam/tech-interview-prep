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
const searchFixtures = questions.filter(({ slug }) => ["final-vs-const-in-dart", "var-vs-dynamic-in-dart"].includes(slug));

test("library search matches question text and short answers", () => {
  assert.equal(filterQuestions(searchFixtures, { ...emptyFilters, search: "وقت الترجمة" }, {}, topics).length, 2);
  assert.equal(filterQuestions(searchFixtures, { ...emptyFilters, search: "const" }, {}, topics).length, 1);
  assert.equal(filterQuestions(searchFixtures, { ...emptyFilters, search: "dynamic" }, {}, topics).length, 1);
  assert.equal(filterQuestions(searchFixtures, { ...emptyFilters, search: "not found" }, {}, topics).length, 0);
});

test("library filters combine with local progress and favorite state", () => {
  const saved = { "dart-001": { progress: "mastered" as const, favorite: true } };
  const filters = { ...emptyFilters, topic: "dart", difficulty: "Junior" as const, progress: "mastered" as const, favoriteOnly: true };

  assert.equal(filterQuestions(searchFixtures, filters, saved, topics).length, 1);
  assert.equal(filterQuestions(searchFixtures, { ...filters, progress: "reviewing" }, saved, topics).length, 0);
  assert.equal(filterQuestions(searchFixtures, { ...emptyFilters, progress: "not-started" }, {}, topics).length, 2);
});

test("shareable query params omit personal progress and favorites", () => {
  const params = toSearchParams({ ...emptyFilters, search: "final", topic: "dart", difficulty: "Junior", progress: "mastered", favoriteOnly: true });
  assert.equal(params.toString(), "search=final&topic=dart&difficulty=Junior");
});

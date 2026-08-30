import assert from "node:assert/strict";
import test from "node:test";

import { topics } from "./questions.ts";
import { filterQuestions, toSearchParams, type LibraryFilters, type SearchableQuestion } from "./question-search.ts";

const emptyFilters: LibraryFilters = {
  search: "",
  topic: "",
  difficulty: "",
  progress: "",
  favoriteOnly: false,
};
const searchFixtures: SearchableQuestion[] = [
  { id: "fixture-001", slug: "fixture-one", topicIds: ["dart"], difficulty: "Junior", question: "What is const?", shortAnswer: "A compile-time constant." },
  { id: "fixture-002", slug: "fixture-two", topicIds: ["dart"], difficulty: "Junior", question: "What is dynamic?", shortAnswer: "A runtime type escape hatch." },
];

test("library search matches question text and short answers", () => {
  assert.equal(filterQuestions(searchFixtures, { ...emptyFilters, search: "compile-time" }, {}, topics).length, 1);
  assert.equal(filterQuestions(searchFixtures, { ...emptyFilters, search: "const" }, {}, topics).length, 1);
  assert.equal(filterQuestions(searchFixtures, { ...emptyFilters, search: "dynamic" }, {}, topics).length, 1);
  assert.equal(filterQuestions(searchFixtures, { ...emptyFilters, search: "not found" }, {}, topics).length, 0);
});

test("library filters combine with local progress and favorite state", () => {
  const saved = { "fixture-001": { progress: "mastered" as const, favorite: true } };
  const filters = { ...emptyFilters, topic: "dart", difficulty: "Junior" as const, progress: "mastered" as const, favoriteOnly: true };

  assert.equal(filterQuestions(searchFixtures, filters, saved, topics).length, 1);
  assert.equal(filterQuestions(searchFixtures, { ...filters, progress: "reviewing" }, saved, topics).length, 0);
  assert.equal(filterQuestions(searchFixtures, { ...emptyFilters, progress: "not-started" }, {}, topics).length, 2);
});

test("shareable query params omit personal progress and favorites", () => {
  const params = toSearchParams({ ...emptyFilters, search: "final", topic: "dart", difficulty: "Junior", progress: "mastered", favoriteOnly: true });
  assert.equal(params.toString(), "search=final&topic=dart&difficulty=Junior");
});

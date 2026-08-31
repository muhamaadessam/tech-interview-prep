import assert from "node:assert/strict";
import test from "node:test";

import { topics } from "./questions.ts";
import { filterInterviewQuestions, filterQuestions, toSearchParams, type LibraryFilters, type SearchableQuestion } from "./question-search.ts";

const emptyFilters: LibraryFilters = {
  search: "",
  topic: "",
  difficulty: "",
  progress: "",
  favoriteOnly: false,
};
const searchFixtures: SearchableQuestion[] = [
  { id: "fixture-001", slug: "fixture-one", trackId: "flutter", topicIds: ["dart"], difficulty: "Junior", question: "What is const?", shortAnswer: "A compile-time constant." },
  { id: "fixture-002", slug: "fixture-two", trackId: "flutter", topicIds: ["dart"], difficulty: "Junior", question: "What is dynamic?", shortAnswer: "A runtime type escape hatch." },
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

test("shareable query params include the active library filters", () => {
  const params = toSearchParams({ ...emptyFilters, search: "final", topic: "dart", difficulty: "Junior", progress: "mastered", favoriteOnly: true });
  assert.equal(params.toString(), "search=final&topic=dart&difficulty=Junior&progress=mastered&favorite=1");
});

test("full interview filters multiple topics and includes lower difficulty levels", () => {
  const fixtures: SearchableQuestion[] = [
    ...searchFixtures,
    { id: "fixture-003", slug: "fixture-three", trackId: "flutter", topicIds: ["oop"], difficulty: "Mid", question: "What is a class?", shortAnswer: "A type." },
    { id: "fixture-004", slug: "fixture-four", trackId: "flutter", topicIds: ["solid"], difficulty: "Senior", question: "What is DIP?", shortAnswer: "Depend on abstractions." },
  ];

  assert.deepEqual(
    filterInterviewQuestions(fixtures, ["dart", "oop"], "Mid", topics).map(({ id }) => id),
    ["fixture-001", "fixture-002", "fixture-003"],
  );
  assert.deepEqual(
    filterInterviewQuestions(fixtures, ["oop", "solid"], "Senior", topics).map(({ id }) => id),
    ["fixture-003", "fixture-004"],
  );
});

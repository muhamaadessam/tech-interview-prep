import type { InterviewQuestion, DifficultyLevel, Topic } from "./questions.ts";
import type { QuestionProgress, SavedQuestions } from "../study/progress.ts";

export type LibraryFilters = {
  search: string;
  topic: string;
  difficulty: DifficultyLevel | "";
  progress: QuestionProgress | "";
  favoriteOnly: boolean;
};

export type SearchableQuestion = Pick<InterviewQuestion, "id" | "slug" | "topicIds" | "difficulty" | "question" | "shortAnswer">;

const difficultyValues: DifficultyLevel[] = ["Junior", "Mid", "Senior"];

export function filterQuestions(
  interviewQuestions: SearchableQuestion[],
  filters: LibraryFilters,
  saved: SavedQuestions,
  availableTopics: Pick<Topic, "id" | "slug">[],
): SearchableQuestion[] {
  const search = filters.search.trim().toLocaleLowerCase();

  return interviewQuestions.filter((question) => {
    const matchesSearch = !search || `${question.question} ${question.shortAnswer}`.toLocaleLowerCase().includes(search);
    const matchesTopic = !filters.topic || availableTopics.some((topic) => question.topicIds.includes(topic.id) && (topic.slug === filters.topic || topic.id === filters.topic));
    const matchesDifficulty = !filters.difficulty || question.difficulty === filters.difficulty;
    const savedQuestion = saved[question.id];
    const matchesProgress = !filters.progress || savedQuestion?.progress === filters.progress;
    const matchesFavorite = !filters.favoriteOnly || savedQuestion?.favorite === true;
    return matchesSearch && matchesTopic && matchesDifficulty && matchesProgress && matchesFavorite;
  });
}

export function toSearchParams(filters: LibraryFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  return params;
}

export function fromSearchParams(params: URLSearchParams): Pick<LibraryFilters, "search" | "topic" | "difficulty"> {
  const difficulty = params.get("difficulty");
  return {
    search: params.get("search") ?? "",
    topic: params.get("topic") ?? "",
    difficulty: difficulty && difficultyValues.includes(difficulty as DifficultyLevel) ? difficulty as DifficultyLevel : "",
  };
}

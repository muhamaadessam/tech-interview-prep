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

export const difficultyOptions: DifficultyLevel[] = ["Junior", "Mid", "Senior"];
const difficultyRank: Record<DifficultyLevel, number> = { Junior: 1, Mid: 2, Senior: 3 };

export function questionHasTopic(question: SearchableQuestion, topicValue: string, availableTopics: Pick<Topic, "id" | "slug">[]): boolean {
  return availableTopics.some((topic) => question.topicIds.includes(topic.id) && (topic.slug === topicValue || topic.id === topicValue));
}

export function filterQuestions(
  interviewQuestions: SearchableQuestion[],
  filters: LibraryFilters,
  saved: SavedQuestions,
  availableTopics: Pick<Topic, "id" | "slug">[],
): SearchableQuestion[] {
  const search = filters.search.trim().toLocaleLowerCase();

  return interviewQuestions.filter((question) => {
    const matchesSearch = !search || `${question.question} ${question.shortAnswer}`.toLocaleLowerCase().includes(search);
    const matchesTopic = !filters.topic || questionHasTopic(question, filters.topic, availableTopics);
    const matchesDifficulty = !filters.difficulty || question.difficulty === filters.difficulty;
    const savedQuestion = saved[question.id];
    const matchesProgress = !filters.progress || (savedQuestion?.progress ?? "not-started") === filters.progress;
    const matchesFavorite = !filters.favoriteOnly || savedQuestion?.favorite === true;
    return matchesSearch && matchesTopic && matchesDifficulty && matchesProgress && matchesFavorite;
  });
}

export function filterInterviewQuestions<T extends SearchableQuestion>(
  interviewQuestions: T[],
  topicValues: string[],
  difficulty: DifficultyLevel,
  availableTopics: Pick<Topic, "id" | "slug">[],
): T[] {
  return interviewQuestions.filter((question) =>
    topicValues.some((topicValue) => questionHasTopic(question, topicValue, availableTopics)) &&
    difficultyRank[question.difficulty] <= difficultyRank[difficulty],
  );
}

export function toSearchParams(filters: LibraryFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.progress) params.set("progress", filters.progress);
  if (filters.favoriteOnly) params.set("favorite", "1");
  return params;
}

export function fromSearchParams(params: URLSearchParams): Pick<LibraryFilters, "search" | "topic" | "difficulty" | "progress" | "favoriteOnly"> {
  const difficulty = params.get("difficulty");
  const progress = params.get("progress");
  return {
    search: params.get("search") ?? "",
    topic: params.get("topic") ?? "",
    difficulty: difficulty && difficultyOptions.includes(difficulty as DifficultyLevel) ? difficulty as DifficultyLevel : "",
    progress: progress && ["not-started", "reviewing", "mastered"].includes(progress) ? progress as QuestionProgress : "",
    favoriteOnly: params.get("favorite") === "1",
  };
}

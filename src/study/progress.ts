export type QuestionProgress = "not-started" | "reviewing" | "mastered";

export type SavedQuestionState = {
  progress: QuestionProgress;
  favorite: boolean;
};

export type SavedQuestions = Record<string, SavedQuestionState>;

export const defaultQuestionState: SavedQuestionState = {
  progress: "not-started",
  favorite: false,
};

type StudyStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const storageKey = "tech-interview-prep:questions:v1";
const progressValues: QuestionProgress[] = ["not-started", "reviewing", "mastered"];

export function getSavedQuestions(storage: Pick<StudyStorage, "getItem">): SavedQuestions {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(storageKey) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) =>
        !!value &&
        typeof value === "object" &&
        progressValues.includes((value as SavedQuestionState).progress) &&
        typeof (value as SavedQuestionState).favorite === "boolean",
      ),
    );
  } catch {
    return {};
  }
}

export function saveQuestionState(
  storage: Pick<StudyStorage, "getItem" | "setItem">,
  questionId: string,
  update: Partial<SavedQuestionState>,
): void {
  const data = getSavedQuestions(storage);
  const current = data[questionId] ?? defaultQuestionState;
  data[questionId] = {
    ...current,
    ...update,
  };

  try {
    storage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // Local storage can be unavailable in private browsing or when its quota is full.
  }
}

export function resetSavedQuestions(storage: Pick<StudyStorage, "removeItem">): void {
  try {
    storage.removeItem(storageKey);
  } catch {
    // The page remains usable when local storage is unavailable.
  }
}

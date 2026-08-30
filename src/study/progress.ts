export type QuestionProgress = "not-started" | "reviewing" | "mastered";

export type QuestionStudy = {
  progress: QuestionProgress;
  favorite: boolean;
};

export type StudyData = Record<string, QuestionStudy>;

type StudyStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const storageKey = "tech-interview-prep:study:v1";
const progressValues: QuestionProgress[] = ["not-started", "reviewing", "mastered"];

export function getStudyData(storage: Pick<StudyStorage, "getItem">): StudyData {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(storageKey) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) =>
        !!value &&
        typeof value === "object" &&
        progressValues.includes((value as QuestionStudy).progress) &&
        typeof (value as QuestionStudy).favorite === "boolean",
      ),
    );
  } catch {
    return {};
  }
}

export function saveQuestionStudy(
  storage: Pick<StudyStorage, "getItem" | "setItem">,
  questionId: string,
  update: Partial<QuestionStudy>,
): void {
  const data = getStudyData(storage);
  const current = data[questionId] ?? { progress: "not-started", favorite: false };
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

export function resetStudyData(storage: Pick<StudyStorage, "removeItem">): void {
  try {
    storage.removeItem(storageKey);
  } catch {
    // The page remains usable when local storage is unavailable.
  }
}

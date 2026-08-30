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

export const questionProgressOptions: { value: QuestionProgress; label: string }[] = [
  { value: "not-started", label: "لم أبدأ" },
  { value: "reviewing", label: "قيد المراجعة" },
  { value: "mastered", label: "متقن" },
];

export type StudyStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const anonymousStorageKey = "tech-interview-prep:questions:v1";
const activeAccountKey = "tech-interview-prep:active-account:v1";
const anonymousOwnerKey = `${anonymousStorageKey}:owner`;
const progressValues: QuestionProgress[] = ["not-started", "reviewing", "mastered"];

export function accountStorageKey(userId: string): string {
  return `${anonymousStorageKey}:${encodeURIComponent(userId)}`;
}

export function getActiveStudyAccount(storage: Pick<StudyStorage, "getItem">): string | null {
  try {
    return storage.getItem(activeAccountKey);
  } catch {
    return null;
  }
}

export function setActiveStudyAccount(storage: Pick<StudyStorage, "setItem" | "removeItem">, userId: string | null): void {
  try {
    if (userId) storage.setItem(activeAccountKey, userId);
    else storage.removeItem(activeAccountKey);
  } catch {
    // Local storage can be unavailable in private browsing or when its quota is full.
  }
}

export function getAnonymousStudyOwner(storage: Pick<StudyStorage, "getItem">): string | null {
  try {
    return storage.getItem(anonymousOwnerKey);
  } catch {
    return null;
  }
}

export function setAnonymousStudyOwner(storage: Pick<StudyStorage, "setItem" | "removeItem">, userId: string | null): void {
  try {
    if (userId) storage.setItem(anonymousOwnerKey, userId);
    else storage.removeItem(anonymousOwnerKey);
  } catch {
    // Local storage can be unavailable in private browsing or when its quota is full.
  }
}

function currentStorageKey(storage: Pick<StudyStorage, "getItem">): string {
  const active = getActiveStudyAccount(storage);
  return active ? accountStorageKey(active) : anonymousStorageKey;
}

export function getSavedQuestions(storage: Pick<StudyStorage, "getItem">, key = currentStorageKey(storage)): SavedQuestions {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? "{}");
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
  key?: string,
): void {
  const data = getSavedQuestions(storage, key);
  const current = data[questionId] ?? defaultQuestionState;
  data[questionId] = {
    ...current,
    ...update,
  };

  try {
    storage.setItem(key ?? currentStorageKey(storage), JSON.stringify(data));
  } catch {
    // Local storage can be unavailable in private browsing or when its quota is full.
  }
}

export function saveSavedQuestions(storage: Pick<StudyStorage, "getItem" | "setItem">, data: SavedQuestions, key?: string): void {
  try {
    storage.setItem(key ?? currentStorageKey(storage), JSON.stringify(data));
  } catch {
    // Local storage can be unavailable in private browsing or when its quota is full.
  }
}

export function resetSavedQuestions(storage: Pick<StudyStorage, "removeItem" | "getItem">, key?: string): void {
  try {
    const targetKey = key ?? currentStorageKey(storage);
    storage.removeItem(targetKey);
    if (targetKey === anonymousStorageKey) storage.removeItem(anonymousOwnerKey);
  } catch {
    // The page remains usable when local storage is unavailable.
  }
}

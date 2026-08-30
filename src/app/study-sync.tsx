"use client";

import { useAuth } from "@clerk/react";
import { useCallback, useEffect, useRef } from "react";

import { syncStudyProgress } from "../study/cloud-progress";
import {
  accountStorageKey,
  anonymousStorageKey,
  getAnonymousStudyOwner,
  getActiveStudyAccount,
  getSavedQuestions,
  saveSavedQuestions,
  setAnonymousStudyOwner,
  setActiveStudyAccount,
  type SavedQuestions,
} from "../study/progress";

export function StudySync() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const syncing = useRef(false);
  const syncingGeneration = useRef<number | null>(null);
  const pending = useRef<"merge" | "replace" | null>(null);
  const generation = useRef(0);

  const runSync = useCallback(async (mode: "merge" | "replace", expectedGeneration = generation.current) => {
    if (expectedGeneration !== generation.current || !isLoaded || !isSignedIn || !userId) return;
    if (syncing.current && syncingGeneration.current === expectedGeneration) {
      pending.current = mode;
      return;
    }
    syncing.current = true;
    syncingGeneration.current = expectedGeneration;
    const storageKey = accountStorageKey(userId);
    try {
      const result = await syncStudyProgress({ storage: localStorage, userId, getToken, mode, storageKey });
      if (expectedGeneration !== generation.current) return;
      if (result.synced) {
        window.dispatchEvent(new Event("study-state-merged"));
      }
    } catch (error) {
      console.warn("Study progress sync unavailable; keeping local state.", error);
    } finally {
      if (syncingGeneration.current !== expectedGeneration) return;
      syncing.current = false;
      syncingGeneration.current = null;
      if (expectedGeneration !== generation.current) return;
      const next = pending.current;
      pending.current = null;
      if (next) queueMicrotask(() => void runSync(next, expectedGeneration));
    }
  }, [getToken, isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (!isLoaded) return;
    const expectedGeneration = ++generation.current;
    pending.current = null;
    if (!isSignedIn || !userId) {
      setActiveStudyAccount(localStorage, null);
      window.dispatchEvent(new Event("study-state-merged"));
      return;
    }

    const storageKey = accountStorageKey(userId);
    if (getActiveStudyAccount(localStorage) !== userId) {
      const anonymousOwner = getAnonymousStudyOwner(localStorage);
      const anonymous = !anonymousOwner || anonymousOwner === userId ? getSavedQuestions(localStorage, anonymousStorageKey) : {};
      const account = getSavedQuestions(localStorage, storageKey);
      const merged = mergeAccountCache(account, anonymous);
      saveSavedQuestions(localStorage, merged, storageKey);
      if (JSON.stringify(getSavedQuestions(localStorage, storageKey)) === JSON.stringify(merged)) {
        if (!anonymousOwner && Object.keys(anonymous).length) setAnonymousStudyOwner(localStorage, userId);
      }
      setActiveStudyAccount(localStorage, userId);
    }

    void runSync("merge", expectedGeneration);
    const onChange = () => void runSync("replace", expectedGeneration);
    window.addEventListener("study-state-change", onChange);
    return () => window.removeEventListener("study-state-change", onChange);
  }, [isLoaded, isSignedIn, runSync, userId]);

  return null;
}

function mergeAccountCache(account: SavedQuestions, anonymous: SavedQuestions): SavedQuestions {
  const merged: SavedQuestions = { ...account };
  for (const [questionId, state] of Object.entries(anonymous)) {
    const current = merged[questionId];
    if (!current || state.progress === "mastered" || (state.progress === "reviewing" && current.progress === "not-started")) {
      merged[questionId] = { ...state, favorite: Boolean(state.favorite || current?.favorite) };
    } else if (state.favorite) {
      merged[questionId] = { ...current, favorite: true };
    }
  }
  return merged;
}

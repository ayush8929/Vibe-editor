"use client";

const STORAGE_KEY = "vibe-editor:preferences";

export interface EditorPreferences {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  aiSuggestionsEnabled: boolean;
}

export const defaultPreferences: EditorPreferences = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  aiSuggestionsEnabled: true,
};

export const getPreferences = (): EditorPreferences => {
  if (typeof window === "undefined") return defaultPreferences;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPreferences;
    return { ...defaultPreferences, ...JSON.parse(raw) };
  } catch {
    return defaultPreferences;
  }
};

export const setPreferences = (prefs: Partial<EditorPreferences>) => {
  if (typeof window === "undefined") return;

  const next = { ...getPreferences(), ...prefs };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent("vibe-editor:preferences-changed", { detail: next }),
  );
  return next;
};

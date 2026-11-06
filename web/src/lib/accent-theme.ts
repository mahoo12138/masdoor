import * as React from "react";

/**
 * The named accent themes, OpenTodo's `theme-engine` set (docs/design-system.md):
 * eight colour identities, each declared by three values — the light palette
 * accent (which the dark palette keeps for its buttons), the bright dark step
 * (focus ring, soft text) and, where the dark buttons need it, a lighter button
 * fill. Hover, soft and soft-text steps derive from these at paint time, the
 * way OpenTodo derives them with color-mix.
 *
 * The values are OpenTodo's own seeds, converted oklch → hex; they land on the
 * familiar Tailwind scale (blue-700, indigo-700, …).
 */

export interface AccentTheme {
  key: string;
  /** English proper noun; theme names are not translated, like OpenTodo's. */
  label: string;
  /** The light accent, also the dark palette's button colour. */
  light: string;
  /** The bright step the dark palette uses for rings and soft text. */
  bright: string;
  /** Overrides the dark palette's button fill (graphite only). */
  dark?: string;
}

export const ACCENT_THEMES: AccentTheme[] = [
  {key: "emerald", label: "Emerald", light: "#047857", bright: "#34d399"},
  {key: "blue", label: "Blue", light: "#1d4ed8", bright: "#60a5fa"},
  {key: "indigo", label: "Indigo", light: "#4338ca", bright: "#818cf8"},
  {key: "violet", label: "Violet", light: "#6d28d9", bright: "#a78bfa"},
  {key: "rose", label: "Rose", light: "#be123c", bright: "#fb7185"},
  {key: "orange", label: "Orange", light: "#c2410c", bright: "#fb923c"},
  {key: "teal", label: "Teal", light: "#0f766e", bright: "#2dd4bf"},
  {key: "graphite", label: "Graphite", light: "#334155", bright: "#cbd5e1", dark: "#475569"},
];

export const DEFAULT_ACCENT_KEY = ACCENT_THEMES[0].key;

const STORAGE_KEY = "masdoor.accent";

function readAccentKey(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_ACCENT_KEY;
  } catch {
    return DEFAULT_ACCENT_KEY;
  }
}

export function getAccentTheme(key?: string): AccentTheme {
  return ACCENT_THEMES.find((theme) => theme.key === key) ?? ACCENT_THEMES[0];
}

let currentKey = typeof window === "undefined" ? DEFAULT_ACCENT_KEY : readAccentKey();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setAccentKey(key: string): void {
  if (key === currentKey) {
    return;
  }
  currentKey = key;
  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // a blocked store just means the choice does not survive a reload
  }
  listeners.forEach((listener) => listener());
}

/** The device's chosen accent theme key, shared by every surface that paints one. */
export function useAccentKey(): string {
  // one store, so the toggle and the painter agree without a context provider
  return React.useSyncExternalStore(subscribe, () => currentKey, () => DEFAULT_ACCENT_KEY);
}

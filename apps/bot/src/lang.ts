import { t, type Lang } from "@ozginbol/core";

/**
 * The language of the reply being built. Bot handlers are synchronous from
 * reading the user to returning the text, so one module-level value is safe:
 * withLang() sets it for the duration of a call and restores it after.
 */
let current: Lang = "uz";

export function L(uz: string, vars?: Record<string, string | number>): string {
  return t(current, uz, vars);
}

export function lang(): Lang {
  return current;
}

export function withLang<T>(l: Lang, fn: () => T): T {
  const prev = current;
  current = l;
  try {
    return fn();
  } finally {
    current = prev;
  }
}

// src/lib/api/keys.ts
export type Gender = "M" | "F";
export type KeyState = { number: number; taken: boolean };

const KEY = "ZS_KEYS_v1";
const TOTAL = 16;

type Store = { M: KeyState[]; F: KeyState[] };

function isSSR() { return typeof window === "undefined"; }
function fresh(): Store {
  return {
    M: Array.from({ length: TOTAL }, (_, i) => ({ number: i + 1, taken: false })),
    F: Array.from({ length: TOTAL }, (_, i) => ({ number: i + 1, taken: false })),
  };
}
function load(): Store {
  if (isSSR()) return fresh();
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const s = fresh();
    localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }
  return JSON.parse(raw) as Store;
}
function save(s: Store) { if (!isSSR()) localStorage.setItem(KEY, JSON.stringify(s)); }

export async function listAvailableKeys(gender: Gender): Promise<number[]> {
  const s = load();
  return s[gender].filter((k) => !k.taken).map((k) => k.number);
}
export async function reserveKeys(gender: Gender, numbers: number[]): Promise<void> {
  const s = load();
  s[gender] = s[gender].map((k) => (numbers.includes(k.number) ? { ...k, taken: true } : k));
  save(s);
}

// Base común para APIs y mocks
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

export const USE_MOCKS =
  (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const LS = {
  get<T>(k: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(k);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set<T>(k: string, v: T) {
    if (typeof window === "undefined") return;
    localStorage.setItem(k, JSON.stringify(v));
  },
};

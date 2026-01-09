export const BACKEND_BASE_URL = "http://localhost:5058";
export const ANALYSIS_BASE_URL = "http://localhost:8000";

export class HttpError extends Error {
	status: number;
	body?: string;
	constructor(status: number, message: string, body?: string) {
		super(message);
		this.name = "HttpError";
		this.status = status;
		this.body = body;
	}
}

export function httpWithBase(baseUrl: string) {
	return async function http<T>(path: string, init?: RequestInit): Promise<T> {
		const headers = new Headers(init?.headers);

		// If there's a body and no explicit Content-Type, assume JSON unless it's a FormData.
		if (!headers.has("Content-Type") && init?.body != null && !(init.body instanceof FormData)) {
			headers.set("Content-Type", "application/json");
		}

		const fetchInit: RequestInit = {
			...init,
			headers,
			cache: init?.cache ?? "no-store",
		};

		let res: Response;
		try {
		res = await fetch(`${baseUrl}${path}`, fetchInit);
		} catch (e: any) {
		// Esto te deja un error con URL exacta (útil para debug)
		throw new TypeError(
			`Failed to fetch: ${baseUrl}${path} (${e?.message ?? "network/CORS"})`
		);
		}


		if (!res.ok) {
			const text = await res.text().catch(() => "");
			const msg = `${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`;
			throw new HttpError(res.status, msg, text);
		}

		if (res.status === 204) return undefined as unknown as T;

		const contentType = res.headers.get("content-type") || "";
		if (contentType.includes("application/json")) {
			return res.json() as Promise<T>;
		}

		// Fallback to text for non-JSON responses
		const text = await res.text();
		return text as unknown as T;
	};
}

export const http = httpWithBase(BACKEND_BASE_URL);
export const httpAnalysis = httpWithBase(ANALYSIS_BASE_URL);
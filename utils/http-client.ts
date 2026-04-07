import { handleApiResponse } from "@/utils/functions";

type QueryValue = string | number | boolean | undefined | null;

export type ApiRequestOptions = {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
    query?: Record<string, QueryValue>;
    headers?: HeadersInit;
    timeoutMs?: number;
    retries?: number;
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
    if (!query) return path;

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
            searchParams.set(key, String(value));
        }
    }

    const queryString = searchParams.toString();
    if (!queryString) return path;
    return `${path}${path.includes("?") ? "&" : "?"}${queryString}`;
}

function withTimeout(timeoutMs: number): AbortSignal {
    return AbortSignal.timeout(timeoutMs);
}

export async function apiRequest<T = unknown>(
    path: string,
    options: ApiRequestOptions = {}
): Promise<T> {
    const {
        method = "GET",
        body,
        query,
        headers,
        timeoutMs = 10000,
        retries = 1,
    } = options;

    const url = buildUrl(path, query);
    const isJsonBody = body !== undefined;
    const requestInit: RequestInit = {
        method,
        headers: {
            ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
            ...headers,
        },
        body: isJsonBody ? JSON.stringify(body) : undefined,
        signal: withTimeout(timeoutMs),
    };

    let attempt = 0;
    let lastError: unknown = null;
    while (attempt <= retries) {
        try {
            const response = await fetch(url, requestInit);
            if (response.status === 401 && typeof window !== "undefined") {
                window.location.href = "/login";
            }
            return await handleApiResponse(response) as T;
        } catch (error) {
            lastError = error;
            attempt += 1;
            if (attempt > retries) break;
        }
    }

    throw lastError instanceof Error ? lastError : new Error("Сетевая ошибка");
}

export function apiGet<T = unknown>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "GET" });
}

export function apiPost<T = unknown>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "POST", body });
}

export function apiPatch<T = unknown>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "PATCH", body });
}

export function apiDelete<T = unknown>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "DELETE" });
}

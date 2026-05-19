import { handleApiResponse, ApiResponseError } from "@/utils/api-errors";
import { logger } from "@/utils/logger";

type QueryValue = string | number | boolean | undefined | null;

const CSRF_HEADER_NAME = "x-csrf-token";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);
let clientCsrfTokenCache: string | null = null;

function clearClientCsrfCache(): void {
    clientCsrfTokenCache = null;
}

async function fetchCsrfToken(): Promise<string | undefined> {
    if (typeof window !== "undefined" && clientCsrfTokenCache) {
        return clientCsrfTokenCache;
    }

    const url =
        typeof window !== "undefined" ? "/api/auth/csrf" : await resolveRequestUrl("/api/auth/csrf");
    const cookieHeader = typeof window === "undefined" ? await getServerCookieHeader() : undefined;

    const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        credentials: typeof window !== "undefined" ? "include" : undefined,
        headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });

    if (!response.ok) {
        return undefined;
    }

    const data = (await response.json()) as { csrf_token?: string };
    const token = data.csrf_token;
    if (typeof window !== "undefined" && token) {
        clientCsrfTokenCache = token;
    }
    return token;
}

async function getServerOrigin(): Promise<string> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
        return appUrl.startsWith("http") ? appUrl.replace(/\/$/, "") : `https://${appUrl}`;
    }

    try {
        const { headers } = await import("next/headers");
        const requestHeaders = await headers();
        const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
        if (host) {
            const proto =
                requestHeaders.get("x-forwarded-proto") ??
                (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
            return `${proto}://${host}`;
        }
    } catch {
        // outside a request context (e.g. scripts)
    }

    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    const port = process.env.PORT ?? "3000";
    return `http://localhost:${port}`;
}

async function resolveRequestUrl(path: string, query?: Record<string, QueryValue>): Promise<string> {
    const relativeUrl = buildUrl(path, query);
    if (typeof window !== "undefined" || /^https?:\/\//i.test(relativeUrl)) {
        return relativeUrl;
    }

    const origin = await getServerOrigin();
    return `${origin}${relativeUrl.startsWith("/") ? relativeUrl : `/${relativeUrl}`}`;
}

async function getServerCookieHeader(csrfToken?: string): Promise<string | undefined> {
    try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const parts = cookieStore
            .getAll()
            .filter((cookie) => cookie.name !== "csrf_token")
            .map((cookie) => `${cookie.name}=${cookie.value}`);

        if (csrfToken) {
            parts.push(`csrf_token=${csrfToken}`);
        }

        return parts.length > 0 ? parts.join("; ") : undefined;
    } catch {
        return csrfToken ? `csrf_token=${csrfToken}` : undefined;
    }
}

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
        timeoutMs = 20000,
        retries = 1,
    } = options;

    const url = await resolveRequestUrl(path, query);
    const isJsonBody = body !== undefined;
    const needsCsrf = MUTATING_METHODS.has(method);
    const csrfToken = needsCsrf ? await fetchCsrfToken() : undefined;
    const cookieHeader =
        typeof window === "undefined" ? await getServerCookieHeader(csrfToken) : undefined;
    const requestInit: RequestInit = {
        method,
        headers: {
            ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
            ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
            ...headers,
        },
        body: isJsonBody ? JSON.stringify(body) : undefined,
        signal: withTimeout(timeoutMs),
        cache: "no-store",
        ...(typeof window === "undefined" ? {} : { credentials: "include" as RequestCredentials }),
    };

    let attempt = 0;
    let lastError: unknown = null;
    while (attempt <= retries) {
        try {
            const response = await fetch(url, requestInit);
            if ((response.status === 401 || response.status === 403) && typeof window !== "undefined") {
                window.location.href = "/login";
            }
            return await handleApiResponse(response) as T;
        } catch (error) {
            lastError = error;
            if (error instanceof ApiResponseError) {
                if (error.status === 503) throw error;
                if (
                    needsCsrf &&
                    error.status === 400 &&
                    error.message.toLowerCase().includes("csrf") &&
                    attempt === 0
                ) {
                    clearClientCsrfCache();
                    const refreshedCsrf = await fetchCsrfToken();
                    if (refreshedCsrf) {
                        const refreshedHeaders: Record<string, string> = {
                            ...(requestInit.headers as Record<string, string>),
                            [CSRF_HEADER_NAME]: refreshedCsrf,
                        };
                        if (typeof window === "undefined") {
                            const refreshedCookies = await getServerCookieHeader(refreshedCsrf);
                            if (refreshedCookies) {
                                refreshedHeaders.Cookie = refreshedCookies;
                            }
                        }
                        requestInit.headers = refreshedHeaders;
                    }
                    attempt += 1;
                    continue;
                }
                if (error.status < 500) throw error;
            }
            logger.debug("apiRequest retry", { path, method, attempt: attempt + 1 });
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

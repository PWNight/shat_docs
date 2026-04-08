import { handleApiResponse } from "@/utils/functions";
import { ApiResponseError } from "@/utils/functions";
import { logger } from "@/utils/logger";

// Тип для значения запроса 
type QueryValue = string | number | boolean | undefined | null;

// Тип для опций запроса API
export type ApiRequestOptions = {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
    query?: Record<string, QueryValue>;
    headers?: HeadersInit;
    timeoutMs?: number;
    retries?: number;
};

// Функция для построения URL запроса
function buildUrl(path: string, query?: Record<string, QueryValue>): string {
    // Проверяем, есть ли параметры запроса
    if (!query) return path;

    // Создаем объект URLSearchParams
    const searchParams = new URLSearchParams();
    // Проходим по всем параметрам запроса
    for (const [key, value] of Object.entries(query)) {
        // Проверяем, не является ли значение undefined или null
        if (value !== undefined && value !== null) {
            searchParams.set(key, String(value));
        }
    }
    // Преобразуем параметры запроса в строку
    const queryString = searchParams.toString();
    // Проверяем, не является ли строка пустой
    if (!queryString) return path;
    // Возвращаем URL запроса
    return `${path}${path.includes("?") ? "&" : "?"}${queryString}`;
}

// Функция для установки таймаута запроса
function withTimeout(timeoutMs: number): AbortSignal {
    return AbortSignal.timeout(timeoutMs);
}

// Функция для выполнения запроса API   
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

    // Строим URL запроса
    const url = buildUrl(path, query);
    // Проверяем, является ли тело запроса JSON
    const isJsonBody = body !== undefined;
    // Создаем объект RequestInit
    const requestInit: RequestInit = {
        method,
        headers: {
            ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
            ...headers,
        },
        body: isJsonBody ? JSON.stringify(body) : undefined,
        signal: withTimeout(timeoutMs),
    };

    // Инициализируем счетчик попыток
    let attempt = 0;
    let lastError: unknown = null;
    // Проходим по всем попыткам
    while (attempt <= retries) {
        // Пытаемся выполнить запрос
        try {
            // Выполняем запрос
            const response = await fetch(url, requestInit);
            // Проверяем, является ли статус ответа 401 или 403
            if ((response.status === 401 || response.status === 403) && typeof window !== "undefined") {
                // Перенаправляем на страницу авторизации
                window.location.href = "/login";
            }
            return await handleApiResponse(response) as T;
        } catch (error) {
            // Сохраняем ошибку
            lastError = error;
            // Проверяем, является ли ошибка ошибкой API
            if (error instanceof ApiResponseError) {
                // Проверяем, является ли статус ответа 503
                if (error.status === 503) throw error;
                // Проверяем, является ли статус ответа меньше 500
                if (error.status < 500) throw error;
            }
            // Логируем попытку выполнения запроса
            logger.debug("apiRequest retry", { path, method, attempt: attempt + 1 });
            // Увеличиваем счетчик попыток
            attempt += 1;
            if (attempt > retries) break;
        }
    }

    // Если все попытки выполнения запроса неуспешны, то выбрасываем ошибку
    throw lastError instanceof Error ? lastError : new Error("Сетевая ошибка");
}

// Функция для выполнения GET запроса API
export function apiGet<T = unknown>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "GET" });
}

// Функция для выполнения POST запроса API
export function apiPost<T = unknown>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "POST", body });
}

// Функция для выполнения PATCH запроса API
export function apiPatch<T = unknown>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "PATCH", body });
}

// Функция для выполнения DELETE запроса API
export function apiDelete<T = unknown>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "DELETE" });
}

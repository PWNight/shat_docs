import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, verifySessionFromToken } from "@/utils/session";
import { ApiErrorResponse, ApiSuccessResponse } from "./interfaces";

// Функция для создания успешного ответа
export function successResponse<T = unknown>(data?: T, message?: string): ApiSuccessResponse<T> {
    return { success: true, data, message };
}

// Функция для создания ошибочного ответа
export function errorResponse(message: string, code?: string, fieldErrors?: Record<string, string[]>): ApiErrorResponse {
    return { success: false, message, code, fieldErrors };
}

// Функция для создания JSON-ответа
export function jsonResponse(data: ApiSuccessResponse | ApiErrorResponse, status: number = 200): NextResponse {
    return NextResponse.json(data, { status });
}

// Функция для создания ответа о неавторизованном запросе
export function unauthorized(message: string = "Необходима авторизация"): NextResponse {
    return jsonResponse(errorResponse(message, "UNAUTHORIZED"), 401);
}

// Функция для создания ответа о недостаточном доступе
export function forbidden(message: string = "Нет доступа"): NextResponse {
    return jsonResponse(errorResponse(message, "FORBIDDEN"), 403);
}

// Функция для создания ответа о ненайденном ресурсе
export function notFound(message: string = "Ресурс не найден"): NextResponse {
    return jsonResponse(errorResponse(message, "NOT_FOUND"), 404);
}

// Функция для создания ответа о некорректном запросе
export function badRequest(message: string, fieldErrors?: Record<string, string[]>): NextResponse {
    return jsonResponse(errorResponse(message, "BAD_REQUEST", fieldErrors), 400);
}

// Функция для создания ответа о внутренней ошибке сервера
export function serverError(
    message: string = "Внутренняя ошибка сервера",
    code: string = "SERVER_ERROR"
): NextResponse {
    const status = code === "DB_OFFLINE" ? 503 : 500;
    return jsonResponse(errorResponse(message, code), status);
}

// Функция для безопасного парсинга JSON из запроса
export async function safeParseJson<T>(request: NextRequest): Promise<{ success: true; data: T } | { success: false; error: string }> {
    try {
        const data = await request.json();
        return { success: true, data };
    } catch {
        return { success: false, error: "Некорректный JSON в теле запроса" };
    }
}

// Функция для валидации данных с использованием Zod
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
    // Валидируем данные с использованием Zod
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    } else {
        // Если данные невалидны, возвращаем ошибки валидации
        const fieldErrors: Record<string, string[]> = {};
        const flattened = result.error.flatten().fieldErrors;
        for (const [key, value] of Object.entries(flattened)) {
            if (value && Array.isArray(value)) {
                fieldErrors[key] = value;
            }
        }
        return { success: false, errors: fieldErrors };
    }
}

// Функция для проверки авторизации
export async function requireAuth(request: NextRequest): Promise<{ success: true; user: NonNullable<Awaited<ReturnType<typeof getSession>>> } | { success: false; response: NextResponse }> {
    const session = await extractSession(request);
    if (!session) {
        return { success: false, response: unauthorized() };
    }
    return { success: true, user: session };
}

// Функция для проверки авторизации без request
export async function requireAuthSimple(): Promise<{ success: true; user: NonNullable<Awaited<ReturnType<typeof getSession>>> } | { success: false; response: NextResponse }> {
    const session = await getSession();
    if (!session) {
        return { success: false, response: unauthorized() };
    }
    return { success: true, user: session };
}

// Функция для извлечения сессии из request
export async function extractSession(request: NextRequest): Promise<NonNullable<Awaited<ReturnType<typeof getSession>>> | null> {
    // Сначала проверяем куки
    const session = await getSession(request);
    if (session) {
        return session;
    }

    // Если куки нет, проверяем заголовок Authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        // Убираем 'Bearer ' из заголовка
        const token = authHeader.slice(7);
        // Расшифровываем токен
        const bearerSession = await verifySessionFromToken(token, request);
        // Если токен расшифрован успешно, возвращаем сессию
        if (bearerSession) {
            return bearerSession;
        }
    }

    return null;
}

// Функция для обработки ошибок API
export function handleApiError(
    error: unknown,
    defaultMessage: string = "Неизвестная ошибка сервера"
): { message: string; code: string } {
    // Логируем ошибку
    console.error("API Error:", error);

    // Преобразуем ошибку в объект
    const err = error as { code?: unknown; message?: unknown };
    // Получаем код ошибки и сообщение
    const errorCode = typeof err?.code === "string" ? err.code : "";
    const errorMessage = typeof err?.message === "string" ? err.message : "";

    // Проверяем, является ли ошибка ошибкой подключения к MySQL
    if (
        ["ETIMEDOUT", "ECONNREFUSED", "ENOTFOUND", "EHOSTUNREACH", "PROTOCOL_CONNECTION_LOST"].includes(errorCode) ||
        // Проверяем, содержит ли сообщение ошибку подключения к MySQL
        /connect\s+etimedout/i.test(errorMessage) ||
        // Проверяем, содержит ли сообщение ошибку поиска адреса
        /getaddrinfo\s+enotfound/i.test(errorMessage)
    ) {
        return { message: "Нет подключения к базе данных", code: "DB_OFFLINE" };
    }

    // Для известных ошибок возвращаем сообщение, но логируем стек
    if (error instanceof Error) {
        return { message: error.message, code: "SERVER_ERROR" };
    }

    // Для неизвестных ошибок возвращаем общее сообщение
    return { message: defaultMessage, code: "SERVER_ERROR" };
}

// Функция для обработки fetch-ответов
export async function handleApiResponse(response: Response): Promise<unknown> {
    // Проверяем, является ли ответ успешным
    if (!response.ok) {
        // Создаем сообщение об ошибке
        let errorMessage = `Ошибка ${response.status}`;
        try {
            // Получаем тип контента
            const contentType = response.headers.get("content-type");
            // Проверяем, является ли контент JSON
            if (contentType && contentType.includes("application/json")) {
                // Получаем данные из ответа
                const errorData = await response.json();
                // Получаем сообщение из данных
                errorMessage = (errorData as { message?: string }).message || errorMessage;
            } else {
                // Если не JSON, используем текст
                const text = await response.text();
                if (text) errorMessage = text;
            }
        } catch {
            // Если не удается прочитать тело, используем статус
            throw new Error(errorMessage);
        }
    }
    try {
        // Получаем данные из ответа
        return await response.json();
    } catch {
        // Если не JSON, возвращаем пустой объект
        return {};
    }
}
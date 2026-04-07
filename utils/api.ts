// Общие утилиты для API v2
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, decryptSession } from "@/utils/session";

// Унифицированные типы ответов API
export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data?: T;
    message?: string;
}

export interface ApiErrorResponse {
    success: false;
    message: string;
    code?: string;
    fieldErrors?: Record<string, string[]>;
}

// Конструкторы ответов
export function successResponse<T = unknown>(data?: T, message?: string): ApiSuccessResponse<T> {
    return { success: true, data, message };
}

export function errorResponse(message: string, code?: string, fieldErrors?: Record<string, string[]>): ApiErrorResponse {
    return { success: false, message, code, fieldErrors };
}

// Вспомогательные конструкторы NextResponse
export function jsonResponse(data: ApiSuccessResponse | ApiErrorResponse, status: number = 200): NextResponse {
    return NextResponse.json(data, { status });
}

export function unauthorized(message: string = "Необходима авторизация"): NextResponse {
    return jsonResponse(errorResponse(message, "UNAUTHORIZED"), 401);
}

export function forbidden(message: string = "Нет доступа"): NextResponse {
    return jsonResponse(errorResponse(message, "FORBIDDEN"), 403);
}

export function notFound(message: string = "Ресурс не найден"): NextResponse {
    return jsonResponse(errorResponse(message, "NOT_FOUND"), 404);
}

export function badRequest(message: string, fieldErrors?: Record<string, string[]>): NextResponse {
    return jsonResponse(errorResponse(message, "BAD_REQUEST", fieldErrors), 400);
}

export function serverError(message: string = "Внутренняя ошибка сервера"): NextResponse {
    return jsonResponse(errorResponse(message, "SERVER_ERROR"), 500);
}

// Безопасный парсинг JSON из запроса
export async function safeParseJson<T>(request: NextRequest): Promise<{ success: true; data: T } | { success: false; error: string }> {
    try {
        const data = await request.json();
        return { success: true, data };
    } catch {
        return { success: false, error: "Некорректный JSON в теле запроса" };
    }
}

// Валидация с Zod
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    } else {
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

// Проверка авторизации (для маршрутов с request)
export async function requireAuth(request: NextRequest): Promise<{ success: true; user: NonNullable<Awaited<ReturnType<typeof getSession>>> } | { success: false; response: NextResponse }> {
    const session = await extractSession(request);
    if (!session) {
        return { success: false, response: unauthorized() };
    }
    return { success: true, user: session };
}

// Проверка авторизации (для маршрутов без request, например GET без параметров)
export async function requireAuthSimple(): Promise<{ success: true; user: NonNullable<Awaited<ReturnType<typeof getSession>>> } | { success: false; response: NextResponse }> {
    const session = await getSession();
    if (!session) {
        return { success: false, response: unauthorized() };
    }
    return { success: true, user: session };
}

// Вспомогательная функция для извлечения сессии из request (куки или Bearer)
export async function extractSession(request: NextRequest): Promise<NonNullable<Awaited<ReturnType<typeof getSession>>> | null> {
    // Сначала проверяем куки
    const session = await getSession();
    if (session) {
        return session;
    }

    // Если куки нет, проверяем заголовок Authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7); // Убираем 'Bearer '
        const bearerSession = await decryptSession(token);
        if (bearerSession) {
            return bearerSession;
        }
    }

    return null;
}

// Обработка исключений в API
export function handleApiError(error: unknown, defaultMessage: string = "Неизвестная ошибка сервера"): { message: string; code: string } {
    console.error("API Error:", error); // Логируем детали для отладки

    if (error instanceof Error) {
        // Для известных ошибок возвращаем сообщение, но логируем стек
        return { message: error.message, code: "SERVER_ERROR" };
    }

    // Для неизвестных ошибок возвращаем общее сообщение
    return { message: defaultMessage, code: "SERVER_ERROR" };
}

// Улучшенная обработка fetch-ответов (для клиентской стороны)
export async function handleApiResponse(response: Response): Promise<unknown> {
    if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}`;
        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                errorMessage = (errorData as { message?: string }).message || errorMessage;
            } else {
                // Если не JSON, используем текст
                const text = await response.text();
                if (text) errorMessage = text;
            }
        } catch {
            // Если не удается прочитать тело, используем статус
        }
        throw new Error(errorMessage);
    }
    try {
        return await response.json();
    } catch {
        // Если тело не JSON, возвращаем текст или пустой объект
        return {};
    }
}
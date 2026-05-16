import { NextRequest } from "next/server";
import { execute, query, queryOne } from "@/utils/sqlite";
import { GroupFormSchema } from "@/utils/definitions";
import {
    requireAuth,
    requireAuthSimple,
    safeParseJson,
    validateData,
    badRequest,
    notFound,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError
} from "@/utils/api";
import { checkRateLimit, rateLimitResponse } from "@/utils/rate-limit";
import { validateCsrfToken } from "@/utils/csrf";

// Получение списка групп
export async function GET() {
    // Rate limiting: 60 requests per minute per user
    const authResult = await requireAuthSimple();
    if (!authResult.success) {
        return authResult.response;
    }

    const clientId = `user:${authResult.user.uid}`;
    const rateLimitResult = checkRateLimit(`groups:get:${clientId}`, 60, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 60);
    }

    try {
        const groups = await query(
            'SELECT "groups".id, name, "groups".created_by, fk_user, users.full_name AS leader FROM "groups" JOIN users ON fk_user = users.id',
        );
        return jsonResponse(successResponse(groups));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

// Создание новой группы
export async function POST(request: NextRequest) {
    // Проверяем авторизацию
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult.response;
    }

    // CSRF protection
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
        return badRequest("Invalid CSRF token");
    }

    // Rate limiting: 10 requests per minute per user
    const clientId = `user:${authResult.user.uid}`;
    const rateLimitResult = checkRateLimit(`groups:post:${clientId}`, 10, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 10);
    }

    // Безопасно парсим JSON
    const parseResult = await safeParseJson(request);
    if (!parseResult.success) {
        return badRequest(parseResult.error);
    }

    // Валидируем данные
    const validation = validateData(GroupFormSchema, parseResult.data);
    if (!validation.success) {
        return badRequest("Ошибка валидации", validation.errors);
    }

    const { name, fk_user } = validation.data;

    try {
        // Проверяем существование пользователя
        const user = await queryOne(
            'SELECT email FROM users WHERE id = ? LIMIT 1',
            [fk_user]
        );
        if (!user) {
            return notFound(`Пользователь с айди ${fk_user} не найден`);
        }

        // Проверяем, существует ли группа с таким именем
        const group = await queryOne(
            'SELECT * FROM "groups" WHERE name = ? LIMIT 1',
            [name]
        );
        if (group) {
            return badRequest(`Группа с названием ${name} уже существует`);
        }

        // TODO: Проверка наличия закреплённой за преподавателем группы

        await execute(
            'INSERT INTO "groups" (name, fk_user) VALUES (?, ?)',
            [name, fk_user]
        );

        return jsonResponse(successResponse(null, `Группа ${name} успешно создана`));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}
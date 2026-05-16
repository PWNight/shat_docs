import { NextRequest } from "next/server";
import { execute, query, queryOne } from "@/utils/sqlite";
import { createSession, revokeAllUserSessions } from "@/utils/session";
import bcrypt from "bcrypt";
import {
    requireAuth,
    safeParseJson,
    badRequest,
    notFound,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError,
} from "@/utils/api";
import { checkRateLimit, rateLimitResponse } from "@/utils/rate-limit";
import { validateCsrfToken } from "@/utils/csrf";

// Получение списка пользователей
export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult.response;
    }

    // Rate limiting: 60 requests per minute per user
    const clientId = `user:${authResult.user.uid}`;
    const rateLimitResult = checkRateLimit(`users:get:${clientId}`, 60, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 60);
    }

    try {
        const users = await query('SELECT id, full_name FROM users');
        return jsonResponse(successResponse(users));
    } catch (error) {
        const { message, code } = handleApiError(error, "Ошибка сервера");
        return serverError(message, code);
    }
}

// Обновление информации о пользователе
export async function PATCH(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (!authResult.success) {
        return authResult.response;
    }

    // CSRF protection
    const csrfValid = await validateCsrfToken(req);
    if (!csrfValid) {
        return badRequest("Invalid CSRF token");
    }

    // Rate limiting: 10 requests per minute per user
    const clientId = `user:${authResult.user.uid}`;
    const rateLimitResult = checkRateLimit(`users:patch:${clientId}`, 10, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 10);
    }

    const parseResult = await safeParseJson<{
        full_name?: string;
        email?: string;
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
    }>(req);
    if (!parseResult.success) {
        return badRequest(parseResult.error);
    }

    try {
        const { user: sessionUser } = authResult;
        const { full_name, email, currentPassword, newPassword, confirmPassword } = parseResult.data;
        const userId = sessionUser.uid;

        // 1. Сбор данных для обновления профиля
        const updateFields: string[] = [];
        const params: string[] = [];

        if (full_name) {
            updateFields.push("full_name = ?");
            params.push(full_name);
        }

        if (email) {
            updateFields.push("email = ?");
            params.push(email);
        }

        // 2. Логика смены пароля
        if (newPassword) {
            // Валидация совпадения
            if (newPassword !== confirmPassword) {
                return badRequest("Новые пароли не совпадают");
            }

            // Проверка текущего пароля
            const dbUser = await queryOne<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", [userId]);
            if (!dbUser) {
                return notFound("Пользователь не найден");
            }

            const isMatch = await bcrypt.compare(currentPassword || "", dbUser.password_hash);
            if (!isMatch) {
                return badRequest("Текущий пароль введен неверно");
            }

            // Хеширование и добавление в запрос
            const newHash = await bcrypt.hash(newPassword, 10);
            updateFields.push("password_hash = ?");
            params.push(newHash);
        }

        // 3. Выполнение запроса, если есть что обновлять
        if (updateFields.length === 0) {
            return badRequest("Нет данных для обновления");
        }

        const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
        params.push(String(userId));

        await execute(sql, params);

        const nextSession = await createSession({
            uid: userId,
            email: email || sessionUser.email,
            full_name: full_name || sessionUser.full_name
        }, req);

        if (newPassword) {
            await revokeAllUserSessions(userId, userId, {
                exceptSessionId: nextSession.sessionId,
                reason: "password_changed",
            });
        }

        return jsonResponse(successResponse(null, newPassword ? "Данные и пароль успешно обновлены" : "Данные успешно обновлены"));

    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}
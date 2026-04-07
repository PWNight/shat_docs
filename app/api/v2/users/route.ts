import { NextRequest } from "next/server";
import { execute, query, queryOne } from "@/utils/mysql";
import { createSession } from "@/utils/session";
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

// Получение списка пользователей
export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult.response;
    }

    try {
        const users = await query('SELECT id, full_name FROM users');
        return jsonResponse(successResponse(users));
    } catch (error) {
        const { message } = handleApiError(error, "Ошибка сервера");
        return serverError(message);
    }
}

// Обновление информации о пользователе
export async function POST(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (!authResult.success) {
        return authResult.response;
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
            const dbUser = await queryOne("SELECT password_hash FROM users WHERE id = ?", [userId]);
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

        await createSession({
            uid: userId,
            email: email || sessionUser.email,
            full_name: full_name || sessionUser.full_name
        });

        return jsonResponse(successResponse(null, newPassword ? "Данные и пароль успешно обновлены" : "Данные успешно обновлены"));

    } catch (error) {
        const { message } = handleApiError(error);
        return serverError(message);
    }
}
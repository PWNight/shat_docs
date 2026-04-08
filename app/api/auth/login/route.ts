import { queryOne } from '@/utils/mysql';
import bcrypt from 'bcrypt';
import { NextRequest } from "next/server";
import { LoginFormSchema } from "@/utils/definitions";
import {
    safeParseJson,
    validateData,
    badRequest,
    unauthorized,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError
} from "@/utils/api";
import { createSession } from '@/utils/session';
import { ensureRootAccount } from "@/utils/admin";

export async function POST(request: NextRequest) {
    try {
        await ensureRootAccount();
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
    // Безопасно парсим JSON
    const parseResult = await safeParseJson(request);
    if (!parseResult.success) {
        return badRequest(parseResult.error);
    }

    // Валидируем данные
    const validation = validateData(LoginFormSchema, parseResult.data);
    if (!validation.success) {
        return badRequest("Ошибка валидации", validation.errors);
    }

    const { email, password } = validation.data;

    try {
        // Получаем пользователя из базы данных
        const user = await queryOne(
            "SELECT id, email, full_name, password_hash, registration_status FROM users WHERE email = ? LIMIT 1",
            [email]
        );
        if (!user) {
            return unauthorized('Пользователь с такой почтой не найден');
        }

        if (user.registration_status !== "approved") {
            return unauthorized("Ваша регистрация ожидает подтверждения администратором");
        }

        // Сравниваем пароли
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return unauthorized("Неправильный пароль");
        }

        const token = await createSession({ uid: user.id, email: user.email, full_name: user.full_name });
        return jsonResponse(successResponse({ uid: user.id, email, full_name: user.full_name, token }));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}
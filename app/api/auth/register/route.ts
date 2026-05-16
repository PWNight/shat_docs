import { execute, queryOne } from "@/utils/sqlite";
import bcrypt from 'bcrypt';
import { NextRequest } from "next/server";
import { RegisterFormSchema } from "@/utils/definitions";
import {
    safeParseJson,
    validateData,
    badRequest,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError
} from "@/utils/api";
import { ensureRootAccount } from "@/utils/admin";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/utils/rate-limit";

export async function POST(request: NextRequest) {
    try {
        await ensureRootAccount();
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }

    // Rate limiting: 3 requests per hour per IP
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(`register:${clientId}`, 3, 60 * 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 3);
    }

    // Безопасно парсим JSON
    const parseResult = await safeParseJson(request);
    if (!parseResult.success) {
        return badRequest(parseResult.error);
    }

    // Валидируем данные
    const validation = validateData(RegisterFormSchema, parseResult.data);
    if (!validation.success) {
        return badRequest("Ошибка валидации", validation.errors);
    }

    const { email, full_name, password } = validation.data;

    try {
        // Проверяем, существует ли пользователь с таким email
        const userWithEmail = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
        if (userWithEmail) {
            return badRequest('Пользователь с такой почтой уже существует');
        }

        // Шифруем пароль и добавляем запись в БД
        const passwordHash = await bcrypt.hash(password, 10);
        await execute(
            "INSERT INTO users (email, full_name, password_hash, registration_status, canAccessAdmin) VALUES (?, ?, ?, 'pending', 0)",
            [email, full_name, passwordHash]
        );
        return jsonResponse(successResponse(null, "Заявка на регистрацию отправлена. Ожидайте подтверждения администратором."));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}
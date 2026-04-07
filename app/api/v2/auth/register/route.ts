import { execute, queryOne } from '@/utils/mysql';
import bcrypt from 'bcrypt';
import { NextRequest } from "next/server";
import { RegisterFormSchema } from "@/utils/definitions";
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

export async function POST(request: NextRequest) {
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
            return unauthorized('Пользователь с такой почтой уже существует');
        }

        // Шифруем пароль и добавляем запись в БД
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await execute(
            'INSERT INTO users (email, full_name, password_hash) VALUES (?, ?, ?)',
            [email, full_name, passwordHash]
        );

        // Получаем ID пользователя и возвращаем ответ
        const userId = result.insertId;
        const token = await createSession({ uid: userId, email, full_name });
        return jsonResponse(successResponse({ uid: userId, email, full_name, token }));
    } catch (error) {
        const { message } = handleApiError(error);
        return serverError(message);
    }
}
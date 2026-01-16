import {execute, queryOne} from '@/utils/mysql';
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from "next/server";
import {RegisterFormSchema} from "@/utils/definitions";
import {z} from "zod";

export async function POST(request: NextRequest) {
    // Получаем JSON объект из формы
    const data = await request.json();

    // Проверяем полученные поля
    const parsed = RegisterFormSchema.safeParse(data);
    if (!parsed.success) {
        return NextResponse.json(
            {
                success: false,
                message: "Ошибка валидации",
                fieldErrors: z.flattenError(parsed.error).fieldErrors
            },
            { status: 400 }
        );
    }

    // Получаем данные из формы
    const { email, full_name, password } = parsed.data;
    try {
        // Получение пользователя из базы данных
        const userWithEmail = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
        if ( userWithEmail ) {
            return NextResponse.json({ success: false, message: 'Пользователь с такой почтой уже существует' }, { status: 401 });
        }

        // Шифрование пароля и добавление записи в БД
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await execute(
            'INSERT INTO users (email, full_name, password_hash) VALUES (?, ?, ?)',
            [email, full_name, passwordHash]
        );

        // Получаем ID пользователя и возвращаем ответ
        const userId = result.insertId;
        return NextResponse.json({ success: true, data: { uid: userId, email, full_name } }, { status: 200 });
    } catch (error) {
        console.error("Ошибка работы API", error);
        const errorMessage =
            error instanceof Error ? error.message : "Неизвестная ошибка сервера";

        return NextResponse.json(
            {
                success: false,
                message: "Внутренняя ошибка сервера",
                error: {
                    message: errorMessage,
                    code: "SERVER_ERROR",
                },
            },
            { status: 500 }
        );
    }
}
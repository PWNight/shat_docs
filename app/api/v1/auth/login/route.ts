import {queryOne} from '@/utils/mysql';
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from "next/server";
import {LoginFormSchema} from "@/utils/definitions";
import {z} from "zod";

export async function POST(request: NextRequest) {
    // Получаем JSON объект из формы
    const data = await request.json();

    // Проверяем полученные поля
    const parsed = LoginFormSchema.safeParse(data);
    if (!parsed.success) {
        const tree = z.treeifyError(parsed.error);
        return NextResponse.json(
            {
                success: false,
                message: "Неверные данные",
                errors: tree,
            },
            { status: 400 }
        );
    }

    // Получаем данные из формы
    const { email, password } = parsed.data;
    try {
        // Получаем пользователя из базы данных
        const user = await queryOne(
            'SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1',
            [email]
        );
        if (!user) {
            return NextResponse.json({ success: false, message: 'Пользователь с такой почтой не найден' }, { status: 401 });
        }

        // Сравниваем пароли
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if ( !passwordMatch ) {
            return NextResponse.json({ success: false, message: "Неправильный пароль" }, { status: 401 });
        }

        return NextResponse.json({ success: true, data: { uid: user.id, email } }, { status: 200 });
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
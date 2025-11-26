import { query } from '@/utils/mysql';
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from "next/server";
import { LoginFormSchema } from "@/utils/definitions";

export async function POST(request: NextRequest) {
    // Получаем JSON объект из формы
    const data = await request.json();

    // Проверяем полученные поля
    const validatedFields = LoginFormSchema.safeParse(data);
    if (!validatedFields.success) {
        return NextResponse.json(
            {
                success: false,
                message: "Неверные данные",
                errors: validatedFields.error.flatten().fieldErrors,
            },
            { status: 400 }
        );
    }

    // Получаем данные из формы
    const { email, password } = validatedFields.data;
    try {
        // Получаем пользователя из базы данных
        const [user]: any = await query('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Пользователь с такой почтой не найден' }, { status: 401 });
        }

        // Сравниваем пароли
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if ( !passwordMatch ) {
            return NextResponse.json({ success: false, message: "Неправильный пароль" }, { status: 401 });
        }

        return NextResponse.json({ success: true, data: { id: user.id, email } }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: 'Серверная ошибка',
            error: {
                message: error.message,
                code: error.code || 'UNKNOWN_ERROR'
            }
        }, { status: 500 });
    }
}
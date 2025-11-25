import { query } from '@/utils/mysql';
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from "next/server";
import { LoginFormSchema } from "@/utils/definitions";

export async function POST(request: NextRequest) {
    const data = await request.json();

    // Проверяем полученные поля
    const validatedFields = LoginFormSchema.safeParse(Object.fromEntries(data));
    if (!validatedFields.success) {
        return NextResponse.json({ success: false, message: "Отсутствуют некоторые параметры", errors: validatedFields.error.flatten().fieldErrors }, { status: 401 });
    }

    // Получаем данные из формы
    const { email, password } = validatedFields.data;
    try {
        // Получение пользователя из базы данных
        const [user]: any = await query('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Пользователь с такой почтой не найден' }, { status: 401 });
        }

        // Сравнение паролей пользователя
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
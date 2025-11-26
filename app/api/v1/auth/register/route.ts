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
        // Получение пользователя из базы данных
        const [ userWithEmail ]: any = await query('SELECT * FROM users WHERE email = ?', [email]);
        if ( userWithEmail ) {
            return NextResponse.json({ success: false, message: 'Пользователь с такой почтой уже существует' }, { status: 401 });
        }

        // Шифрование пароля и добавление записи в БД
        const passwordHash = await bcrypt.hash(password, 10);
        const result : any = await query('INSERT INTO users ( email, password_hash ) VALUES ( ?, ? )', [email, passwordHash]);

        // Получаем ID пользователя и возвращаем ответ
        const userId = result.insertId;
        return NextResponse.json({ success: true, data: { uid: userId, email } }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: 'Серверная ошибка',
            error: error
        }, { status: 500 });
    }
}
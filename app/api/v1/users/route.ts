import {NextResponse } from "next/server";
import {execute, query, queryOne} from "@/utils/mysql";
import {createSession, getSession} from "@/utils/session";
import bcrypt from "bcrypt";

// Получение списка пользователей
export async function GET() {
    try {
        const userData = await getSession();
        if (!userData) {
            return NextResponse.json({ success: false, message: "Необходима авторизация" }, { status: 401 });
        }

        const users = await query('SELECT id, full_name FROM users');

        return NextResponse.json({ success: true, data: users }, { status: 200 });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ success: false, message: "Ошибка сервера" }, { status: 500 });
    }
}

// Обновление информации о пользователе
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: "Нет доступа" }, { status: 401 });
        }

        const { full_name, email, currentPassword, newPassword, confirmPassword } = await req.json();
        const userId = session.uid;

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
                return NextResponse.json({ success: false, message: "Новые пароли не совпадают" }, { status: 400 });
            }

            // Проверка текущего пароля
            const user = await queryOne("SELECT password_hash FROM users WHERE id = ?", [userId]);
            if (!user) {
                return NextResponse.json({ success: false, message: "Пользователь не найден" }, { status: 404 });
            }

            const isMatch = await bcrypt.compare(currentPassword || "", user.password_hash);
            if (!isMatch) {
                return NextResponse.json({ success: false, message: "Текущий пароль введен неверно" }, { status: 400 });
            }

            // Хеширование и добавление в запрос
            const newHash = await bcrypt.hash(newPassword, 10);
            updateFields.push("password_hash = ?");
            params.push(newHash);
        }

        // 3. Выполнение запроса, если есть что обновлять
        if (updateFields.length === 0) {
            return NextResponse.json({ success: false, message: "Нет данных для обновления" }, { status: 400 });
        }

        const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
        params.push(String(userId));

        await execute(sql, params);

        await createSession({
            uid: userId,
            email: email || session.email,
            full_name: full_name || session.full_name
        });

        return NextResponse.json({
            success: true,
            message: newPassword ? "Данные и пароль успешно обновлены" : "Данные успешно обновлены"
        });

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
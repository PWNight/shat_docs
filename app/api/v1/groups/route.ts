import {NextRequest, NextResponse} from "next/server";
import {execute, query, queryOne} from "@/utils/mysql";
import {GroupFormSchema} from "@/utils/definitions";
import {z} from "zod";
import {getSession} from "@/utils/session";

// GET ALL GROUPS
export async function GET(request: NextRequest) {
    try{
        const userData = await getSession();
        if (!userData){
            return NextResponse.json({ success: false, message: "Для доступа требуется авторизоваться" }, {status:401})
        }

        const groups = await query(
            'SELECT * FROM groups',
        );
        return NextResponse.json({ success: true, data: groups }, {status:200})
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

// CREATE NEW GROUP
export async function POST(request: NextRequest) {
    try {
        const userData = await getSession();
        if (!userData){
            return NextResponse.json({ success: false, message: "Для доступа требуется авторизоваться" }, {status:401})
        }

        // Получаем JSON объект из формы
        const data = await request.json();

        // Проверяем полученные поля
        const parsed = GroupFormSchema.safeParse(data);
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
        const { name, fk_user } = parsed.data;

        // Получаем пользователя из базы данных
        const user = await queryOne(
            'SELECT email FROM users WHERE id = ? LIMIT 1',
            [fk_user]
        );
        if (!user) {
            return NextResponse.json({ success: false, message: `Пользователь с айди ${fk_user} не найден` }, { status: 404 });
        }

        // Получаем группу из базы данных
        const group = await queryOne(
            'SELECT * FROM groups WHERE name = ? LIMIT 1',
            [name]
        );
        if (group) {
            return NextResponse.json({ success: false, message: `Группа с названием ${name} уже существует` }, { status: 400 });
        }

        // TODO: Проверка наличия закреплённой за преподавателем группы (добавить новую группу может только администратор или свободный преподаватель)

        await execute(
            'INSERT INTO groups (name, fk_user) VALUES (?, ?)',
            [name, fk_user]
        );

        return NextResponse.json({ success: true, message: `Группа ${name} успешно создана` }, { status: 200 });
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
import {NextRequest, NextResponse} from "next/server";
import {execute, query, queryOne} from "@/utils/mysql";
import {z} from "zod";
import {getSession} from "@/utils/session";
import {StudentFormSchema} from "@/utils/definitions";

// GET ALL STUDENTS (FOR ADMINS)
export async function GET(request: NextRequest) {
    try{
        const userData = await getSession();
        if (!userData){
            return NextResponse.json({ success: false, message: "Для доступа требуется авторизоваться" }, {status:401})
        }

        // TODO: Проверка доступа к просмотру (доступ только для администратора)

        const students = await query(
            'SELECT * FROM students',
        );
        return NextResponse.json({ success: true, data: students }, {status:200})
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

// CREATE NEW STUDENT
export async function POST(request: NextRequest) {
    try {
        const userData = await getSession();
        if (!userData){
            return NextResponse.json({ success: false, message: "Для доступа требуется авторизоваться" }, {status:401})
        }

        // Получаем JSON объект из формы
        const data = await request.json();

        // Проверяем полученные поля
        const parsed = StudentFormSchema.safeParse(data);
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
        const { full_name, admission_year, fk_group } = parsed.data;

        // Получаем группу из БД
        const group = await queryOne(
            'SELECT * FROM groups WHERE id = ? LIMIT 1',
            [fk_group]
        );
        if (!group) {
            return NextResponse.json({ success: false, message: `Группа с айди ${fk_group} не найдена` }, { status: 404 });
        }

        // TODO: Проверка доступа к добавлению студента (доступ только для классного руководителя)

        await execute(
            'INSERT INTO students (full_name, admission_year, fk_group) VALUES (?, ?)',
            [full_name, admission_year, fk_group]
        );

        return NextResponse.json({ success: true, message: `Студент успешно создан` }, { status: 200 });
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
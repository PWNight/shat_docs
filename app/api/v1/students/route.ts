import {NextRequest, NextResponse} from "next/server";
import {execute, query, queryOne} from "@/utils/mysql";
import {z} from "zod";
import {getSession} from "@/utils/session";
import {StudentFormSchema} from "@/utils/definitions";

// GET ALL STUDENTS (FOR ADMINS)
export async function GET() {
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
        const { full_name, fk_group } = parsed.data;

        // Получаем группу из БД
        const group = await queryOne(
            'SELECT * FROM groups WHERE id = ? LIMIT 1',
            [fk_group]
        );
        if (!group) {
            return NextResponse.json({ success: false, message: `Группа с айди ${fk_group} не найдена` }, { status: 404 });
        }

        if (userData.uid !== group.fk_user) {
            return NextResponse.json({ success: false, message: "Вы не можете добавлять студентов в чужую группу" }, { status: 403 });
        }

        await execute(
            'INSERT INTO students (full_name, fk_group) VALUES (?, ?)',
            [full_name, fk_group]
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
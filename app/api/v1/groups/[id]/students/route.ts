import {NextRequest, NextResponse} from "next/server";
import {query, execute} from "@/utils/mysql";
import {getSession} from "@/utils/session";


// GET STUDENTS BY GROUP ID
export async function GET(_request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    try{
        const userData = await getSession();
        if (!userData){
            return NextResponse.json({ success: false, message: "Для доступа требуется авторизоваться" }, {status:401})
        }

        const {id} = await params;
        const students = await query(
            'SELECT * FROM students WHERE fk_group = ?', [id]
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

// POST - CREATE STUDENTS
export async function POST(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    try {
        const userData = await getSession();
        if (!userData) {
            return NextResponse.json({ success: false, message: "Для доступа требуется авторизоваться" }, {status:401})
        }

        const {id} = await params;
        const { students } = await request.json();

        if (!Array.isArray(students)) {
            return NextResponse.json({ success: false, message: "Неверный формат данных" }, {status:400})
        }

        for (const student of students) {
            await execute(
                'INSERT INTO students (full_name, fk_group) VALUES (?, ?) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)',
                [student.fullName, id]
            );
        }

        return NextResponse.json({ success: true, message: "Студенты добавлены" }, {status:201})
    } catch (error) {
        console.error("Ошибка создания студентов", error);
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
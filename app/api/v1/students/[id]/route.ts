import {NextRequest, NextResponse} from "next/server";
import {execute, queryOne} from "@/utils/mysql";
import {getSession} from "@/utils/session";
import {z} from "zod";
import {StudentFormSchema} from "@/utils/definitions";

// GET STUDENT BY ID
export async function GET(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    try{
        const userData = await getSession();
        if (!userData){
            return NextResponse.json({ success: false, message: "Для доступа требуется авторизоваться" }, {status:401})
        }

        const {id} = await params;
        const group = await queryOne(
            'SELECT * FROM groups WHERE id = ?', [id]
        );
        if (!group) {
            return NextResponse.json({ success: false, message: `Группа с айди ${id} не найдена` }, {status:404})
        }
        return NextResponse.json({ success: true, data: group }, {status:200})
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

// UPDATE STUDENT BY ID
export async function POST(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    try{
        const userData = await getSession();
        if (!userData){
            return NextResponse.json({ success: false, message: "Для доступа требуется авторизоваться" }, {status:401})
        }

        const {id} = await params;
        const student = await queryOne(`
            SELECT s.*, g.fk_user as owner_id 
            FROM students s 
            JOIN groups g ON s.fk_group = g.id 
            WHERE s.id = ?`,
        [id]);

        if (!student) {
            return NextResponse.json({ success: false, message: `Студент с айди ${id} не найден` }, {status:404})
        }

        if (userData.uid !== student.owner_id) {
            return NextResponse.json({ success: false, message: "Нет прав доступа к этому студенту" }, { status: 403 });
        }

        // TODO: Написать проверку доступа к обновлению (обновить студента может только классный руководитель его группы либо администратор)

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
        
        const updates: string[] = []
        const values: unknown[] = [];

        Object.entries(parsed.data).forEach(([key, value]) => {
            updates.push(`${key} = ?`);
            values.push(value);
        });

        if (updates.length === 0) {
            return NextResponse.json({ success: false, message: "Данные из формы совпадают с данными в базе" }, { status: 400 });
        }

        values.push(id);
        await execute(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`, values)
        return NextResponse.json({ success: true, message: "Студент успешно обновлён" }, { status: 200 });
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
// DELETE STUDENT BY ID
export async function DELETE(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    try{
        const userData = await getSession();
        if (!userData){
            return NextResponse.json({ success: false, message: "Для доступа требуется авторизоваться" }, {status:401})
        }

        const {id} = await params;
        const student = await queryOne(`
            SELECT s.*, g.fk_user as owner_id 
            FROM students s 
            JOIN groups g ON s.fk_group = g.id 
            WHERE s.id = ?`,
            [id]);

        if (!student) {
            return NextResponse.json({ success: false, message: `Студент с айди ${id} не найден` }, {status:404})
        }

        if (userData.uid !== student.owner_id) {
            return NextResponse.json({ success: false, message: "Нет прав доступа к этому студенту" }, { status: 403 });
        }

        await execute("DELETE FROM students WHERE id = ?", [id]);
        return NextResponse.json({ success: true, message: `Студент с айди ${id} успешно удален` }, {status:200})
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
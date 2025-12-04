import {NextRequest, NextResponse} from "next/server";
import {execute, queryOne} from "@/utils/mysql";
import {getSession} from "@/utils/session";
import {GroupFormSchema} from "@/utils/definitions";
import {z} from "zod";

// GET GROUP BY ID
export async function GET(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    try{
        const userData = await getSession();
        if (!userData){
            return NextResponse.json({ success: false, message: "Для доступа требуется авторизоваться" }, {status:401})
        }

        const {id} = await params;
        const group = await queryOne(
            'SELECT * FROM groups WHERE id = ? LIMIT 1', [id]
        );
        if (!group) {
            return NextResponse.json({ success: false, message: `Группа с айди ${id} не найдена` }, {status:404})
        }
        return NextResponse.json({ success: true }, {status:200})
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

// UPDATE GROUP BY ID
async function POST(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    try{
        const userData = await getSession();
        if (!userData){
            return NextResponse.json({ success: false, message: "Для доступа требуется авторизоваться" }, {status:401})
        }

        const {id} = await params;
        const group = await queryOne(
            'SELECT * FROM groups WHERE id = ? LIMIT 1', [id]
        );
        if (!group) {
            return NextResponse.json({ success: false, message: `Группа с айди ${id} не найдена` }, {status:404})
        }

        if (userData.uid != group.fk_user){
            return NextResponse.json({ success: false, message: `Вы не можете обновить эту группу` }, {status:403})
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
        
        const updates: string[] = []
        const values: string [] = []

        for (const key in parsed.data) {
            if (parsed.data.hasOwnProperty(key)) {
                updates.push(`${key} = ?`);
                values.push(parsed.data[key]);
            }
        }

        if (updates.length === 0) {
            return NextResponse.json({ success: false, message: "Данные из формы совпадают с данными в базе" }, { status: 400 });
        }

        values.push(id);
        await execute(`UPDATE groups SET ${updates.join(', ')} WHERE id = ?`, values)
        return NextResponse.json({ success: true, message: "Группа успешно обновлена" }, { status: 200 });
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

export default POST

// DELETE GROUP BY ID
export async function DELETE(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    try{
        const userData = await getSession();
        if (!userData){
            return NextResponse.json({ success: false, message: "Для доступа требуется авторизоваться" }, {status:401})
        }

        const {id} = await params;
        const group = await queryOne(
            'SELECT * FROM groups WHERE id = ? LIMIT 1', [id]
        );
        if (!group) {
            return NextResponse.json({ success: false, message: `Группа с айди ${id} не найдена` }, {status:404})
        }

        if (userData.uid != group.fk_user){
            return NextResponse.json({ success: false, message: `Вы не можете удалить эту группу` }, {status:403})
        }

        await execute("DELETE FROM groups WHERE id = ?", [id]);
        return NextResponse.json({ success: true, message: `Группа с айди ${id} успешно удалена` }, {status:200})
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
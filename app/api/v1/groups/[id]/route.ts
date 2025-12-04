import {NextRequest, NextResponse} from "next/server";
import {execute, queryOne} from "@/utils/mysql";
import {getSession} from "@/utils/session";

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
import {NextRequest, NextResponse} from "next/server";
import {queryOne} from "@/utils/mysql";
import {getSession} from "@/utils/session";

// GET USER BY ID
export async function GET(_request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    try{
        const userData = await getSession();
        if (!userData){
            return NextResponse.json({ success: false, message: "Для доступа требуется авторизоваться" }, {status:401})
        }

        const {id} = await params;
        const user = await queryOne(
            'SELECT * FROM users WHERE id = ?', [id]
        );
        if (!user) {
            return NextResponse.json({ success: false, message: `Пользователь с айди ${id} не найден` }, {status:404})
        }
        return NextResponse.json({ success: true, data: user }, {status:200})
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
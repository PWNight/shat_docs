import {decryptSession, deleteSession} from "@/utils/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const session = request.cookies.get('s_token')
        if( session === undefined ){
            return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 })
        }

        const userData = await decryptSession(session?.value)
        if( userData === null ){
            return NextResponse.json({ success: false, error: 'Токен некорректен' }, { status: 422 })
        }

        await deleteSession()
        return NextResponse.json({ success: true, message: "Успешно" }, {status:200})
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
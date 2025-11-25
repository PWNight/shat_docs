import { decrypt, deleteSession } from "@/utils/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const session = request.cookies.get('s_token')
        if( session === undefined ){
            return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 })
        }

        const userData = await decrypt(session?.value)
        if( userData === null ){
            return NextResponse.json({ success: false, error: 'Токен некорректен' }, { status: 422 })
        }

        await deleteSession()
        return NextResponse.json({ success: true, message: "Успешно" }, {status:200})
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: 'Серверная ошибка',
            error: {
                message: error.message,
                code: error.code || 'UNKNOWN_ERROR'
            }
        }, {status:500})
    }
}
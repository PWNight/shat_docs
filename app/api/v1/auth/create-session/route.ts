import { createSession, encrypt } from "@/utils/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const data = await request.json();
    const uid = data.id;
    const email = data.email

    //TODO: Добавить валидацию

    try {
        // Заносим UID и Почту в сессию
        const expiresAt = new Date(Date.now() + 7  *  24  *  60  *  60  *  1000); // 7 дней

        const sessionToken = await encrypt({ data: { uid, email}, expiresAt });

        await createSession(sessionToken, expiresAt)
        return NextResponse.json({ success: true, token: sessionToken }, { status: 200 });

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

import { createSession, encrypt } from "@/utils/session";
import { NextRequest, NextResponse } from "next/server";
import { SessionFormSchema } from "@/utils/definitions";

export async function POST(request: NextRequest) {
    const data = await request.json();

    // Проверяем полученные поля
    const validatedFields = SessionFormSchema.safeParse(Object.fromEntries(data));
    if (!validatedFields.success) {
        return NextResponse.json({ success: false, message: "Отсутствуют некоторые параметры", errors: validatedFields.error.flatten().fieldErrors }, { status: 401 });
    }

    // Получаем данные из формы
    const { uid, email } = validatedFields.data;

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

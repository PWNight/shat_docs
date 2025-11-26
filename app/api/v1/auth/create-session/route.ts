import { createSession } from "@/utils/session";
import { SessionFormSchema } from "@/utils/definitions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        // Получаем JSON объект из формы
        const data = await request.json();

        // Проверяем данные формы
        const validatedFields = SessionFormSchema.safeParse(data);
        if (!validatedFields.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Неверные данные",
                    errors: validatedFields.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        // Получаем данные
        const { uid, email } = validatedFields.data;

        // Создаём безопасную сессию
        await createSession({ uid, email });

        return NextResponse.json(
            { success: true, message: "Сессия создана" },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: 'Серверная ошибка',
            error: error
        }, { status: 500 });
    }
}
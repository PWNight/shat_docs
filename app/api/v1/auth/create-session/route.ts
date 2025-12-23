import { createSession } from "@/utils/session";
import {SessionFormSchema} from "@/utils/definitions";
import { NextRequest, NextResponse } from "next/server";
import {z} from "zod";

export async function POST(request: NextRequest) {
    try {
        // Получаем JSON объект из формы
        const data = await request.json();

        // Проверяем данные формы
        const parsed = SessionFormSchema.safeParse(data);
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

        // Получаем данные
        const { uid, email } = parsed.data;

        // Создаём безопасную сессию
        await createSession({ uid, email });

        return NextResponse.json(
            { success: true, message: "Сессия создана" },
            { status: 200 }
        );
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
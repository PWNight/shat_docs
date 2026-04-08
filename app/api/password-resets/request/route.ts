import { NextRequest } from "next/server";
import { execute, queryOne } from "@/utils/mysql";
import { badRequest, handleApiError, jsonResponse, serverError, successResponse } from "@/utils/api";
import { requireAuth } from "@/utils/api";

export async function POST(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.response;

    try {
        const existingPending = await queryOne<{ id: number }>(
            "SELECT id FROM password_reset_requests WHERE user_id = ? AND status = 'pending' LIMIT 1",
            [authResult.user.uid]
        );
        if (existingPending) {
            return badRequest("У вас уже есть активная заявка на сброс пароля");
        }

        await execute(
            "INSERT INTO password_reset_requests (user_id, status) VALUES (?, 'pending')",
            [authResult.user.uid]
        );

        return jsonResponse(successResponse(null, "Заявка на сброс пароля отправлена"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

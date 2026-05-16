import { NextRequest } from "next/server";
import { execute, queryOne } from "@/utils/sqlite";
import { badRequest, handleApiError, jsonResponse, serverError, successResponse } from "@/utils/api";
import { requireAuth } from "@/utils/api";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/utils/rate-limit";
import { validateCsrfToken } from "@/utils/csrf";

export async function POST(request: NextRequest) {
    // CSRF protection
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
        return badRequest("Invalid CSRF token");
    }

    // Rate limiting: 3 requests per hour per IP
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(`password-reset:${clientId}`, 3, 60 * 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 3);
    }

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

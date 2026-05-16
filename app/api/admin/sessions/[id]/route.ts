import { NextRequest } from "next/server";
import { badRequest, handleApiError, jsonResponse, serverError, successResponse } from "@/utils/api";
import { requireAdmin, writeAdminLog } from "@/utils/admin";
import { revokeSessionById } from "@/utils/session";
import { checkRateLimit, rateLimitResponse } from "@/utils/rate-limit";
import { validateCsrfToken } from "@/utils/csrf";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    // CSRF protection
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
        return badRequest("Invalid CSRF token");
    }

    // Rate limiting: 10 requests per minute per admin
    const clientId = `admin:${adminCheck.actor.id}`;
    const rateLimitResult = checkRateLimit(`admin:sessions:delete:${clientId}`, 10, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 10);
    }

    try {
        const { id } = await params;
        if (!id?.trim()) return badRequest("Некорректный id сессии");

        const revoked = await revokeSessionById(id, adminCheck.actor.id, { reason: "admin_revoke" });
        if (!revoked) return badRequest("Сессия не найдена или уже завершена");

        await writeAdminLog(adminCheck.actor.id, "ADMIN_REVOKE_SESSION", `sessionId=${id}`);
        return jsonResponse(successResponse(null, "Сессия отозвана администратором"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

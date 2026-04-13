import { NextRequest } from "next/server";
import { badRequest, handleApiError, jsonResponse, serverError, successResponse } from "@/utils/api";
import { requireAdmin, writeAdminLog } from "@/utils/admin";
import { revokeSessionById } from "@/utils/session";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

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

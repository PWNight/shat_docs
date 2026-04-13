import { NextRequest } from "next/server";
import { badRequest, handleApiError, jsonResponse, requireAuth, serverError, successResponse } from "@/utils/api";
import { deleteSession, revokeSessionById } from "@/utils/session";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.response;

    try {
        const { id } = await params;
        if (!id?.trim()) return badRequest("Некорректный id сессии");

        const revoked = await revokeSessionById(id, authResult.user.uid, {
            ownerUserId: authResult.user.uid,
            reason: "owner_revoke",
        });
        if (!revoked) return badRequest("Сессия не найдена или уже завершена");

        if (id === authResult.user.sid) {
            await deleteSession();
        }

        return jsonResponse(successResponse(null, "Сессия отозвана"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

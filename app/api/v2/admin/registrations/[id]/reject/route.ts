import { NextRequest } from "next/server";
import { execute, queryOne } from "@/utils/mysql";
import { badRequest, handleApiError, jsonResponse, notFound, serverError, successResponse } from "@/utils/api";
import { requireAdmin, writeAdminLog } from "@/utils/admin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    try {
        const { id } = await params;
        const targetId = Number(id);
        if (!Number.isFinite(targetId) || targetId <= 0) return badRequest("Некорректный id пользователя");

        const target = await queryOne<{ id: number; registration_status: string }>(
            "SELECT id, registration_status FROM users WHERE id = ? LIMIT 1",
            [targetId]
        );
        if (!target) return notFound("Пользователь не найден");
        if (target.registration_status === "rejected") return badRequest("Пользователь уже отклонен");

        await execute(
            "UPDATE users SET registration_status = 'rejected', canAccessAdmin = 0, isAdmin = 0, approved_by = ?, approved_at = NOW() WHERE id = ?",
            [adminCheck.actor.id, targetId]
        );
        await writeAdminLog(adminCheck.actor.id, "REJECT_REGISTRATION", `targetUserId=${targetId}`);

        return jsonResponse(successResponse({ userId: targetId }, "Регистрация отклонена"));
    } catch (error) {
        const { message } = handleApiError(error);
        return serverError(message);
    }
}

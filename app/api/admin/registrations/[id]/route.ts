import { NextRequest } from "next/server";
import { execute, queryOne } from "@/utils/mysql";
import { badRequest, handleApiError, jsonResponse, notFound, safeParseJson, serverError, successResponse } from "@/utils/api";
import { requireAdmin, writeAdminLog } from "@/utils/admin";

type RegistrationStatus = "approved" | "rejected";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    const parseResult = await safeParseJson<{ status?: RegistrationStatus }>(request);
    if (!parseResult.success) return badRequest(parseResult.error);

    const status = parseResult.data.status;
    if (status !== "approved" && status !== "rejected") {
        return badRequest("Некорректный статус заявки. Допустимо: approved | rejected");
    }

    try {
        const { id } = await params;
        const targetId = Number(id);
        if (!Number.isFinite(targetId) || targetId <= 0) return badRequest("Некорректный id пользователя");

        const target = await queryOne<{ id: number; registration_status: string }>(
            "SELECT id, registration_status FROM users WHERE id = ? LIMIT 1",
            [targetId]
        );
        if (!target) return notFound("Пользователь не найден");
        if (target.registration_status === status) {
            return badRequest(status === "approved" ? "Пользователь уже подтвержден" : "Пользователь уже отклонен");
        }

        if (status === "approved") {
            await execute(
                "UPDATE users SET registration_status = 'approved', approved_by = ?, approved_at = NOW() WHERE id = ?",
                [adminCheck.actor.id, targetId]
            );
            await writeAdminLog(adminCheck.actor.id, "APPROVE_REGISTRATION", `targetUserId=${targetId}`);
            return jsonResponse(successResponse({ userId: targetId, status }, "Регистрация подтверждена"));
        }

        await execute(
            "UPDATE users SET registration_status = 'rejected', canAccessAdmin = 0, isAdmin = 0, approved_by = ?, approved_at = NOW() WHERE id = ?",
            [adminCheck.actor.id, targetId]
        );
        await writeAdminLog(adminCheck.actor.id, "REJECT_REGISTRATION", `targetUserId=${targetId}`);
        return jsonResponse(successResponse({ userId: targetId, status }, "Регистрация отклонена"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

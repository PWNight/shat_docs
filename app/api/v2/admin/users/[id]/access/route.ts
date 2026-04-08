import { NextRequest } from "next/server";
import { execute, queryOne } from "@/utils/mysql";
import { badRequest, handleApiError, jsonResponse, notFound, serverError, successResponse } from "@/utils/api";
import { requireAdmin, writeAdminLog } from "@/utils/admin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    try {
        const { id } = await params;
        const parseId = Number(id);
        if (!Number.isFinite(parseId) || parseId <= 0) return badRequest("Некорректный id пользователя");
        if (parseId === adminCheck.actor.id) return badRequest("Нельзя менять доступ самому себе");

        const target = await queryOne<{ id: number; full_name: string; canAccessAdmin: number; isRoot: number }>(
            "SELECT id, full_name, canAccessAdmin, isRoot FROM users WHERE id = ? LIMIT 1",
            [parseId]
        );
        if (!target) return notFound("Пользователь не найден");
        if (target.isRoot) return badRequest("Нельзя менять права root пользователя");

        const nextAccess = target.canAccessAdmin ? 0 : 1;
        await execute(
            "UPDATE users SET canAccessAdmin = ?, isAdmin = ? WHERE id = ?",
            [nextAccess, nextAccess, parseId]
        );
        await writeAdminLog(
            adminCheck.actor.id,
            nextAccess ? "GRANT_ADMIN_ACCESS" : "REVOKE_ADMIN_ACCESS",
            `targetUserId=${parseId}`
        );

        return jsonResponse(successResponse({ userId: parseId, canAccessAdmin: nextAccess }, "Права обновлены"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

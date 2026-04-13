import { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { execute, queryOne } from "@/utils/mysql";
import { badRequest, handleApiError, jsonResponse, notFound, safeParseJson, serverError, successResponse } from "@/utils/api";
import { requireAdmin, writeAdminLog } from "@/utils/admin";
import { revokeAllUserSessions } from "@/utils/session";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    const parseResult = await safeParseJson<{ newPassword: string }>(request);
    if (!parseResult.success) return badRequest(parseResult.error);

    const newPassword = parseResult.data.newPassword?.trim();
    if (!newPassword || newPassword.length < 8) {
        return badRequest("Новый пароль должен быть длиной не менее 8 символов");
    }

    try {
        const { id } = await params;
        const resetId = Number(id);
        if (!Number.isFinite(resetId) || resetId <= 0) return badRequest("Некорректный id заявки");

        const resetRequest = await queryOne<{ id: number; user_id: number; status: string }>(
            "SELECT id, user_id, status FROM password_reset_requests WHERE id = ? LIMIT 1",
            [resetId]
        );
        if (!resetRequest) return notFound("Заявка не найдена");
        if (resetRequest.status !== "pending") return badRequest("Заявка уже обработана");

        const hash = await bcrypt.hash(newPassword, 10);
        await execute("UPDATE users SET password_hash = ? WHERE id = ?", [hash, resetRequest.user_id]);
        await revokeAllUserSessions(resetRequest.user_id, adminCheck.actor.id, { reason: "admin_resolve_reset_password" });
        await execute(
            "UPDATE password_reset_requests SET status = 'resolved', resolved_by = ?, resolved_at = NOW() WHERE id = ?",
            [adminCheck.actor.id, resetId]
        );
        await writeAdminLog(adminCheck.actor.id, "RESET_USER_PASSWORD", `requestId=${resetId}, targetUserId=${resetRequest.user_id}`);

        return jsonResponse(successResponse(null, "Пароль пользователя обновлен"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

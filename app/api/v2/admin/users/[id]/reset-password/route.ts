import { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { execute, queryOne } from "@/utils/mysql";
import { badRequest, handleApiError, jsonResponse, notFound, safeParseJson, serverError, successResponse } from "@/utils/api";
import { requireAdmin, writeAdminLog } from "@/utils/admin";

type ResetPayload = {
    newPassword: string;
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    const parseResult = await safeParseJson<ResetPayload>(request);
    if (!parseResult.success) return badRequest(parseResult.error);

    const newPassword = parseResult.data.newPassword?.trim();
    if (!newPassword || newPassword.length < 8) {
        return badRequest("Новый пароль должен быть длиной не менее 8 символов");
    }

    try {
        const { id } = await params;
        const userId = Number(id);
        if (!Number.isFinite(userId) || userId <= 0) return badRequest("Некорректный id пользователя");

        const target = await queryOne<{ id: number }>("SELECT id FROM users WHERE id = ? LIMIT 1", [userId]);
        if (!target) return notFound("Пользователь не найден");

        const hash = await bcrypt.hash(newPassword, 10);
        await execute("UPDATE users SET password_hash = ? WHERE id = ?", [hash, userId]);
        await writeAdminLog(adminCheck.actor.id, "ADMIN_RESET_USER_PASSWORD", `targetUserId=${userId}`);

        return jsonResponse(successResponse(null, "Пароль пользователя обновлен"));
    } catch (error) {
        const { message } = handleApiError(error);
        return serverError(message);
    }
}

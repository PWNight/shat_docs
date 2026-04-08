import { NextRequest } from "next/server";
import { execute, queryOne } from "@/utils/mysql";
import { badRequest, handleApiError, jsonResponse, notFound, safeParseJson, serverError, successResponse } from "@/utils/api";
import { requireAdmin, writeAdminLog } from "@/utils/admin";

type UserPatchPayload = {
    full_name?: string;
    email?: string;
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    const parseResult = await safeParseJson<UserPatchPayload>(request);
    if (!parseResult.success) return badRequest(parseResult.error);

    try {
        const { id } = await params;
        const userId = Number(id);
        if (!Number.isFinite(userId) || userId <= 0) return badRequest("Некорректный id пользователя");

        const target = await queryOne<{ id: number; isRoot: number }>(
            "SELECT id, isRoot FROM users WHERE id = ? LIMIT 1",
            [userId]
        );
        if (!target) return notFound("Пользователь не найден");

        const updates: string[] = [];
        const values: Array<string | number> = [];

        if (typeof parseResult.data.full_name === "string" && parseResult.data.full_name.trim()) {
            updates.push("full_name = ?");
            values.push(parseResult.data.full_name.trim());
        }

        if (typeof parseResult.data.email === "string" && parseResult.data.email.trim()) {
            const email = parseResult.data.email.trim().toLowerCase();
            const exists = await queryOne<{ id: number }>(
                "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
                [email, userId]
            );
            if (exists) return badRequest("Email уже используется");
            updates.push("email = ?");
            values.push(email);
        }

        if (updates.length === 0) return badRequest("Нет данных для обновления");

        values.push(userId);
        await execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
        await writeAdminLog(adminCheck.actor.id, "ADMIN_UPDATE_USER", `targetUserId=${userId}`);

        return jsonResponse(successResponse(null, "Пользователь обновлен"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    try {
        const { id } = await params;
        const userId = Number(id);
        if (!Number.isFinite(userId) || userId <= 0) return badRequest("Некорректный id пользователя");
        if (userId === adminCheck.actor.id) return badRequest("Нельзя удалить самого себя");

        const target = await queryOne<{ id: number; isRoot: number }>(
            "SELECT id, isRoot FROM users WHERE id = ? LIMIT 1",
            [userId]
        );
        if (!target) return notFound("Пользователь не найден");
        if (target.isRoot) return badRequest("Нельзя удалить root пользователя");

        await execute("DELETE FROM users WHERE id = ?", [userId]);
        await writeAdminLog(adminCheck.actor.id, "ADMIN_DELETE_USER", `targetUserId=${userId}`);

        return jsonResponse(successResponse(null, "Пользователь удален"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

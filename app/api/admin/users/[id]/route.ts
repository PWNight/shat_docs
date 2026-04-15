import { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { execute, queryOne } from "@/utils/mysql";
import { badRequest, handleApiError, jsonResponse, notFound, safeParseJson, serverError, successResponse } from "@/utils/api";
import { requireAdmin, writeAdminLog } from "@/utils/admin";
import { revokeAllUserSessions } from "@/utils/session";

type UserPatchPayload = {
    full_name?: string;
    email?: string;
    action?: "toggle_access" | "reset_password";
    newPassword?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeName(value: string): string {
    return value.trim().replace(/\s+/g, " ");
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    const parseResult = await safeParseJson<UserPatchPayload>(request);
    if (!parseResult.success) return badRequest(parseResult.error);

    try {
        const { id } = await params;
        const userId = Number(id);
        if (!Number.isFinite(userId) || userId <= 0) return badRequest("Некорректный id пользователя");

        const target = await queryOne<{ id: number; isRoot: number; canAccessAdmin: number }>(
            "SELECT id, isRoot, canAccessAdmin FROM users WHERE id = ? LIMIT 1",
            [userId]
        );
        if (!target) return notFound("Пользователь не найден");

        if (parseResult.data.action === "toggle_access") {
            if (userId === adminCheck.actor.id) return badRequest("Нельзя менять доступ самому себе");
            if (target.isRoot) return badRequest("Нельзя менять права root пользователя");

            const nextAccess = target.canAccessAdmin ? 0 : 1;
            await execute(
                "UPDATE users SET canAccessAdmin = ?, isAdmin = ? WHERE id = ?",
                [nextAccess, nextAccess, userId]
            );
            await writeAdminLog(
                adminCheck.actor.id,
                nextAccess ? "GRANT_ADMIN_ACCESS" : "REVOKE_ADMIN_ACCESS",
                `targetUserId=${userId}`
            );
            return jsonResponse(successResponse({ userId, canAccessAdmin: nextAccess }, "Права обновлены"));
        }

        if (parseResult.data.action === "reset_password") {
            const newPassword = parseResult.data.newPassword?.trim();
            if (!newPassword || newPassword.length < 8) {
                return badRequest("Новый пароль должен быть длиной не менее 8 символов");
            }
            if (newPassword.length > 72) {
                return badRequest("Новый пароль слишком длинный");
            }
            if (!/[A-Za-zА-Яа-я]/.test(newPassword) || !/\d/.test(newPassword)) {
                return badRequest("Пароль должен содержать хотя бы одну букву и одну цифру");
            }

            const hash = await bcrypt.hash(newPassword, 10);
            await execute("UPDATE users SET password_hash = ? WHERE id = ?", [hash, userId]);
            await revokeAllUserSessions(userId, adminCheck.actor.id, { reason: "admin_reset_password" });
            await writeAdminLog(adminCheck.actor.id, "ADMIN_RESET_USER_PASSWORD", `targetUserId=${userId}`);

            return jsonResponse(successResponse(null, "Пароль пользователя обновлен"));
        }

        const updates: string[] = [];
        const values: Array<string | number> = [];

        if (typeof parseResult.data.full_name === "string" && parseResult.data.full_name.trim()) {
            const fullName = normalizeName(parseResult.data.full_name);
            if (fullName.length < 2 || fullName.length > 120) {
                return badRequest("ФИО должно быть от 2 до 120 символов");
            }
            updates.push("full_name = ?");
            values.push(fullName);
        }

        if (typeof parseResult.data.email === "string" && parseResult.data.email.trim()) {
            const email = parseResult.data.email.trim().toLowerCase();
            if (email.length > 254 || !EMAIL_RE.test(email)) return badRequest("Некорректный email");
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

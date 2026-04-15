import { NextRequest } from "next/server";
import { execute, queryOne } from "@/utils/mysql";
import { badRequest, handleApiError, jsonResponse, notFound, safeParseJson, serverError, successResponse } from "@/utils/api";
import { requireAdmin, writeAdminLog } from "@/utils/admin";

function normalizeGroupName(value: string): string {
    return value.trim().replace(/\s+/g, " ");
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    const parseResult = await safeParseJson<{ name?: string; fk_user?: number | string }>(request);
    if (!parseResult.success) return badRequest(parseResult.error);

    try {
        const { id } = await params;
        const groupId = Number(id);
        if (!Number.isFinite(groupId) || groupId <= 0) return badRequest("Некорректный id группы");

        const group = await queryOne<{ id: number }>("SELECT id FROM `groups` WHERE id = ? LIMIT 1", [groupId]);
        if (!group) return notFound("Группа не найдена");

        const updates: string[] = [];
        const values: Array<string | number> = [];

        if (typeof parseResult.data.name === "string" && parseResult.data.name.trim()) {
            const normalizedName = normalizeGroupName(parseResult.data.name);
            if (normalizedName.length < 2 || normalizedName.length > 80) {
                return badRequest("Название группы должно быть от 2 до 80 символов");
            }
            updates.push("name = ?");
            values.push(normalizedName);
        }

        if (parseResult.data.fk_user !== undefined) {
            const fkUser = Number(parseResult.data.fk_user);
            if (!Number.isFinite(fkUser) || fkUser <= 0) return badRequest("Некорректный преподаватель");
            const owner = await queryOne<{ id: number }>("SELECT id FROM users WHERE id = ? LIMIT 1", [fkUser]);
            if (!owner) return notFound("Преподаватель не найден");
            updates.push("fk_user = ?");
            values.push(fkUser);
        }

        if (updates.length === 0) return badRequest("Нет данных для обновления");
        values.push(groupId);

        await execute(`UPDATE \`groups\` SET ${updates.join(", ")} WHERE id = ?`, values);
        await writeAdminLog(adminCheck.actor.id, "ADMIN_UPDATE_GROUP", `groupId=${groupId}`);
        return jsonResponse(successResponse(null, "Группа обновлена"));
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
        const groupId = Number(id);
        if (!Number.isFinite(groupId) || groupId <= 0) return badRequest("Некорректный id группы");

        const group = await queryOne<{ id: number }>("SELECT id FROM `groups` WHERE id = ? LIMIT 1", [groupId]);
        if (!group) return notFound("Группа не найдена");

        await execute("DELETE FROM `groups` WHERE id = ?", [groupId]);
        await writeAdminLog(adminCheck.actor.id, "ADMIN_DELETE_GROUP", `groupId=${groupId}`);
        return jsonResponse(successResponse(null, "Группа удалена"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

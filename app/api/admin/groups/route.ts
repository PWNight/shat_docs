import { NextRequest } from "next/server";
import { execute, query, queryOne } from "@/utils/mysql";
import { badRequest, handleApiError, jsonResponse, notFound, safeParseJson, serverError, successResponse } from "@/utils/api";
import { requireAdmin, writeAdminLog } from "@/utils/admin";

export async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    try {
        const groups = await query(
            "SELECT g.id, g.name, g.created_by, g.fk_user, u.full_name AS owner_name FROM `groups` g LEFT JOIN users u ON u.id = g.fk_user ORDER BY g.id DESC"
        );
        return jsonResponse(successResponse(groups));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

export async function POST(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    const parseResult = await safeParseJson<{ name?: string; fk_user?: number | string }>(request);
    if (!parseResult.success) return badRequest(parseResult.error);

    try {
        const name = parseResult.data.name?.trim();
        const fkUser = Number(parseResult.data.fk_user);
        if (!name) return badRequest("Название группы обязательно");
        if (!Number.isFinite(fkUser) || fkUser <= 0) return badRequest("Некорректный преподаватель");

        const owner = await queryOne<{ id: number }>("SELECT id FROM users WHERE id = ? LIMIT 1", [fkUser]);
        if (!owner) return notFound("Преподаватель не найден");

        await execute("INSERT INTO `groups` (name, fk_user) VALUES (?, ?)", [name, fkUser]);
        await writeAdminLog(adminCheck.actor.id, "ADMIN_CREATE_GROUP", `name=${name}, fk_user=${fkUser}`);

        return jsonResponse(successResponse(null, "Группа создана"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

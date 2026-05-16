import { NextRequest } from "next/server";
import { execute, query, queryOne } from "@/utils/sqlite";
import { badRequest, handleApiError, jsonResponse, notFound, safeParseJson, serverError, successResponse } from "@/utils/api";
import { requireAdmin, writeAdminLog } from "@/utils/admin";
import { checkRateLimit, rateLimitResponse } from "@/utils/rate-limit";
import { validateCsrfToken } from "@/utils/csrf";

function normalizeGroupName(value: string): string {
    return value.trim().replace(/\s+/g, " ");
}

export async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    // Rate limiting: 30 requests per minute per admin
    const clientId = `admin:${adminCheck.actor.id}`;
    const rateLimitResult = checkRateLimit(`admin:groups:get:${clientId}`, 30, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 30);
    }

    try {
        const groups = await query(
            "SELECT g.id, g.name, g.created_by, g.fk_user, u.full_name AS owner_name FROM \"groups\" g LEFT JOIN users u ON u.id = g.fk_user ORDER BY g.id DESC"
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

    // CSRF protection
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
        return badRequest("Invalid CSRF token");
    }

    // Rate limiting: 10 requests per minute per admin
    const clientId = `admin:${adminCheck.actor.id}`;
    const rateLimitResult = checkRateLimit(`admin:groups:post:${clientId}`, 10, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 10);
    }

    const parseResult = await safeParseJson<{ name?: string; fk_user?: number | string }>(request);
    if (!parseResult.success) return badRequest(parseResult.error);

    try {
        const name = parseResult.data.name ? normalizeGroupName(parseResult.data.name) : "";
        const fkUser = Number(parseResult.data.fk_user);
        if (!name) return badRequest("Название группы обязательно");
        if (name.length < 2 || name.length > 80) return badRequest("Название группы должно быть от 2 до 80 символов");
        if (!Number.isFinite(fkUser) || fkUser <= 0) return badRequest("Некорректный преподаватель");

        const owner = await queryOne<{ id: number }>("SELECT id FROM users WHERE id = ? LIMIT 1", [fkUser]);
        if (!owner) return notFound("Преподаватель не найден");

        await execute("INSERT INTO \"groups\" (name, fk_user) VALUES (?, ?)", [name, fkUser]);
        await writeAdminLog(adminCheck.actor.id, "ADMIN_CREATE_GROUP", `name=${name}, fk_user=${fkUser}`);

        return jsonResponse(successResponse(null, "Группа создана"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

import { NextRequest } from "next/server";
import { query, execute } from "@/utils/sqlite";
import {
    requireAuth,
    safeParseJson,
    badRequest,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError,
} from "@/utils/api";
import { checkRateLimit, rateLimitResponse } from "@/utils/rate-limit";
import { validateCsrfToken } from "@/utils/csrf";
import { requireGroupAccess } from "@/utils/group-access";


// Получение списка студентов
export async function GET(_request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth(_request);
    if (!authResult.success) {
        return authResult.response;
    }

    // Rate limiting: 60 requests per minute per user
    const clientId = `user:${authResult.user.uid}`;
    const rateLimitResult = checkRateLimit(`students:get:${clientId}`, 60, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 60);
    }

    try{
        const {id} = await params;
        const access = await requireGroupAccess(_request, id);
        if (!access.success) {
            return access.response;
        }

        const students = await query(
            'SELECT * FROM students WHERE fk_group = ?', [access.group.id]
        );
        return jsonResponse(successResponse(students));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

// Создание нового студента
export async function POST(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult.response;
    }

    // CSRF protection
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
        return badRequest("Invalid CSRF token");
    }

    // Rate limiting: 20 requests per minute per user
    const clientId = `user:${authResult.user.uid}`;
    const rateLimitResult = checkRateLimit(`students:post:${clientId}`, 20, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 20);
    }

    const parseResult = await safeParseJson<{ students?: Array<{ fullName: string }> }>(request);
    if (!parseResult.success) {
        return badRequest(parseResult.error);
    }

    const students = parseResult.data.students;
    if (!Array.isArray(students)) {
        return badRequest("Неверный формат данных");
    }

    try {
        const {id} = await params;
        const access = await requireGroupAccess(request, id);
        if (!access.success) {
            return access.response;
        }

        for (const student of students) {
            await execute(
                'INSERT INTO students (full_name, fk_group) VALUES (?, ?) ON CONFLICT(full_name, fk_group) DO UPDATE SET full_name = excluded.full_name',
                [student.fullName, access.group.id]
            );
        }

        return jsonResponse(successResponse(null, "Студенты добавлены"), 201);
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}
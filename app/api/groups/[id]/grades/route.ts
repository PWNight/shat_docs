import { NextRequest } from "next/server";
import { execute, query, queryOne } from "@/utils/sqlite";
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

// Получение успеваемости за конкретный период
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult.response;
    }

    // Rate limiting: 60 requests per minute per user
    const clientId = `user:${authResult.user.uid}`;
    const rateLimitResult = checkRateLimit(`grades:get:${clientId}`, 60, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 60);
    }

    try {
        const { id } = await params;
        const access = await requireGroupAccess(request, id);
        if (!access.success) {
            return access.response;
        }

        const { searchParams } = new URL(request.url);
        const periodSemester = searchParams.get('periodSemester');

        let sqlQuery = `SELECT full_name as fullName, subjects_json as subjects, average_score as averageScore, period_semester as periodSemester
             FROM grades WHERE fk_group = ?`;

        const queryParams: (string | number)[] = [access.group.id];

        if (periodSemester) {
            const parsedSemester = Number.parseInt(periodSemester, 10);
            if (Number.isNaN(parsedSemester)) {
                return badRequest("periodSemester должен быть числом");
            }
            sqlQuery += ` AND period_semester = ?`;
            queryParams.push(parsedSemester);
        }

        const rows = await query(sqlQuery, queryParams);

        const data = rows.map(row => ({
            ...row,
            subjects: typeof row.subjects === 'string' ? JSON.parse(row.subjects) : row.subjects
        }));

        return jsonResponse(successResponse(data));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

// Добавление успеваемости за конкретный период
export async function POST(request: NextRequest) {
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
    const rateLimitResult = checkRateLimit(`grades:post:${clientId}`, 20, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 20);
    }

    const parseResult = await safeParseJson<{
        groupId?: string | number;
        students?: Array<{
            fullName: string;
            subjects: unknown;
            averageScore: number;
            periodSemester?: number | null;
        }>;
    }>(request);
    if (!parseResult.success) {
        return badRequest(parseResult.error);
    }

    const { groupId, students } = parseResult.data;
    if (!groupId || !Array.isArray(students)) {
        return badRequest("Неверный формат данных");
    }

    const access = await requireGroupAccess(request, groupId);
    if (!access.success) {
        return access.response;
    }

    try {
        for (const student of students) {
            const studentRow = await queryOne<{ id: number }>(
                "SELECT id FROM students WHERE fk_group = ? AND full_name = ? LIMIT 1",
                [access.group.id, student.fullName]
            );

            await execute(
                `INSERT INTO grades (fk_group, full_name, fk_student, subjects_json, average_score, period_semester)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON CONFLICT(fk_group, full_name, period_semester) DO UPDATE SET
                        fk_student = excluded.fk_student,
                        subjects_json = excluded.subjects_json,
                        average_score = excluded.average_score,
                        period_semester = excluded.period_semester,
                        updated_at = datetime('now')`,
                [access.group.id, student.fullName, studentRow?.id ?? null, JSON.stringify(student.subjects), student.averageScore, student.periodSemester || null]
            );
        }
        return jsonResponse(successResponse(null, "Успеваемость обновлена"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

// Удаление успеваемости за конкретный период
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult.response;
    }

    // CSRF protection
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
        return badRequest("Invalid CSRF token");
    }

    // Rate limiting: 10 requests per minute per user
    const clientId = `user:${authResult.user.uid}`;
    const rateLimitResult = checkRateLimit(`grades:delete:${clientId}`, 10, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 10);
    }

    try {
        const { id } = await params;
        const access = await requireGroupAccess(request, id);
        if (!access.success) {
            return access.response;
        }

        const { searchParams } = new URL(request.url);
        const periodSemester = searchParams.get('periodSemester');

        if (!periodSemester) {
            return badRequest("Не указан период для удаления");
        }

        const parsedSemester = Number.parseInt(periodSemester, 10);
        if (Number.isNaN(parsedSemester)) {
            return badRequest("periodSemester должен быть числом");
        }

        await execute(`DELETE FROM grades WHERE fk_group = ? AND period_semester = ?`, [access.group.id, parsedSemester]);
        return jsonResponse(successResponse(null, "Записи удалены"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}
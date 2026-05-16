import { NextRequest } from "next/server";
import { execute, query } from "@/utils/sqlite";
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

// Получение посещаемости за конкретный период
export async function GET(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult.response;
    }

    // Rate limiting: 60 requests per minute per user
    const clientId = `user:${authResult.user.uid}`;
    const rateLimitResult = checkRateLimit(`attendance:get:${clientId}`, 60, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 60);
    }

    try {
        const {id} = await params;
        const { searchParams } = new URL(request.url);
        const periodMonth = searchParams.get('periodMonth');

        let sql = `SELECT
                id as number,
                full_name as fullName,
                full_days_total as fullDaysTotal,
                full_days_sick as fullDaysSick,
                lessons_total as lessonsTotal,
                lessons_sick as lessonsSick,
                late,
                period_month as periodMonth
            FROM attendance WHERE fk_group = ?`;

        const params_arr: (string | number)[] = [id];

        if (periodMonth) {
            const parsedMonth = Number.parseInt(periodMonth, 10);
            if (Number.isNaN(parsedMonth)) {
                return badRequest("periodMonth должен быть числом");
            }
            sql += ` AND period_month = ?`;
            params_arr.push(parsedMonth);
        }

        const rows = await query(sql, params_arr);

        return jsonResponse(successResponse(rows));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

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
    const rateLimitResult = checkRateLimit(`attendance:post:${clientId}`, 20, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 20);
    }

    const parseResult = await safeParseJson<{
        groupId?: string | number;
        students?: Array<{
            fullName: string;
            fullDaysTotal: number;
            fullDaysSick: number;
            lessonsTotal: number;
            lessonsSick: number;
            late: number;
            periodMonth?: number | null;
        }>;
    }>(request);
    if (!parseResult.success) {
        return badRequest(parseResult.error);
    }

    const { groupId, students } = parseResult.data;
    if (!groupId || !Array.isArray(students)) {
        return badRequest("Неверный формат данных");
    }

    try {
        for (const student of students) {
            await execute(
                `INSERT INTO attendance
                (fk_group, full_name, full_days_total, full_days_sick, lessons_total, lessons_sick, late, period_month)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(fk_group, full_name, period_month) DO UPDATE SET
                full_days_total = excluded.full_days_total,
                full_days_sick = excluded.full_days_sick,
                lessons_total = excluded.lessons_total,
                lessons_sick = excluded.lessons_sick,
                late = excluded.late,
                period_month = excluded.period_month,
                updated_at = datetime('now')`,
                [
                    groupId,
                    student.fullName,
                    student.fullDaysTotal,
                    student.fullDaysSick,
                    student.lessonsTotal,
                    student.lessonsSick,
                    student.late,
                    student.periodMonth || null
                ]
            );
        }

        return jsonResponse(successResponse(null, "Посещаемость обновлена"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

// Удаление записей посещаемости за конкретный период
export async function DELETE(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
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
    const rateLimitResult = checkRateLimit(`attendance:delete:${clientId}`, 10, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 10);
    }

    try {
        const {id} = await params;
        const { searchParams } = new URL(request.url);
        const periodMonth = searchParams.get('periodMonth');

        if (!periodMonth) {
            return badRequest("Не указан период для удаления");
        }

        const parsedMonth = Number.parseInt(periodMonth, 10);
        if (Number.isNaN(parsedMonth)) {
            return badRequest("periodMonth должен быть числом");
        }

        await execute(`DELETE FROM attendance WHERE fk_group = ? AND period_month = ?`, [id, parsedMonth]);

        return jsonResponse(successResponse(null, "Записи удалены"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}
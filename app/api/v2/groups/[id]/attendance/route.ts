import { NextRequest } from "next/server";
import { execute } from "@/utils/mysql";
import {
    requireAuth,
    safeParseJson,
    badRequest,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError,
} from "@/utils/api";

// Получение посещаемости за конкретный период
export async function GET(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult.response;
    }

    try {
        const {id} = await params;
        const { searchParams } = new URL(request.url);
        const periodMonth = searchParams.get('periodMonth');

        let query = `SELECT
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
            query += ` AND period_month = ?`;
            params_arr.push(parsedMonth);
        }

        const rows = await execute(query, params_arr);

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
                ON DUPLICATE KEY UPDATE
                full_days_total = VALUES(full_days_total),
                full_days_sick = VALUES(full_days_sick),
                lessons_total = VALUES(lessons_total),
                lessons_sick = VALUES(lessons_sick),
                late = VALUES(late),
                period_month = VALUES(period_month)`,
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
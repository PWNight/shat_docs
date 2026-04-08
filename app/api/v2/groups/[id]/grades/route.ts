import { NextRequest } from "next/server";
import { execute, query } from "@/utils/mysql";
import {
    requireAuth,
    safeParseJson,
    badRequest,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError,
} from "@/utils/api";

// Получение успеваемости за конкретный период
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult.response;
    }

    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const periodSemester = searchParams.get('periodSemester');

        let sqlQuery = `SELECT full_name as fullName, subjects_json as subjects, average_score as averageScore, period_semester as periodSemester
             FROM grades WHERE fk_group = ?`;

        const queryParams: (string | number)[] = [id];

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

    try {
        for (const student of students) {
            await execute(
                `INSERT INTO grades (fk_group, full_name, subjects_json, average_score, period_semester)
                 VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        subjects_json = VALUES(subjects_json),
                        average_score = VALUES(average_score),
                        period_semester = VALUES(period_semester)`,
                [groupId, student.fullName, JSON.stringify(student.subjects), student.averageScore, student.periodSemester || null]
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

    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const periodSemester = searchParams.get('periodSemester');

        if (!periodSemester) {
            return badRequest("Не указан период для удаления");
        }

        const parsedSemester = Number.parseInt(periodSemester, 10);
        if (Number.isNaN(parsedSemester)) {
            return badRequest("periodSemester должен быть числом");
        }

        await execute(`DELETE FROM grades WHERE fk_group = ? AND period_semester = ?`, [id, parsedSemester]);
        return jsonResponse(successResponse(null, "Записи удалены"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}
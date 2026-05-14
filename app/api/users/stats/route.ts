import { NextRequest } from "next/server";
import { queryOne } from "@/utils/sqlite";
import {
    requireAuth,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError,
} from "@/utils/api";

// Получение статистики о группе пользователя
export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult.response;
    }

    try {
        const { user } = authResult;

        type CountsRow = { groupsCount: number; studentsCount: number };
        type GradesRow = { avgGrade: number | null };
        type AttendanceRow = { total: number | null; sick: number | null; late: number | null };

        // 1. Считаем общее кол-во групп и студентов
        const counts = await queryOne<CountsRow>(`
            SELECT 
                COUNT(DISTINCT g.id) as groupsCount,
                COUNT(DISTINCT s.id) as studentsCount
            FROM "groups" g
            LEFT JOIN students s ON s.fk_group = g.id
            WHERE g.fk_user = ?
        `, [user.uid]);

        // 2. Считаем средний балл по всем управляемым группам
        const grades = await queryOne<GradesRow>(`
            SELECT AVG(average_score) as avgGrade
            FROM grades gr
            JOIN "groups" g ON gr.fk_group = g.id
            WHERE g.fk_user = ?
        `, [user.uid]);

        // 3. Считаем посещаемость
        const attendance = await queryOne<AttendanceRow>(`
            SELECT 
                SUM(lessons_total) as total,
                SUM(lessons_sick) as sick,
                SUM(late) as late
            FROM attendance a
            JOIN "groups" g ON a.fk_group = g.id
            WHERE g.fk_user = ?
        `, [user.uid]);

        return jsonResponse(
            successResponse({
                groups: counts?.groupsCount || 0,
                students: counts?.studentsCount || 0,
                avgGrade: Number(grades?.avgGrade || 0).toFixed(2),
                attendance: {
                    total: Number(attendance?.total ?? 0),
                    sick: Number(attendance?.sick ?? 0),
                    late: Number(attendance?.late ?? 0),
                    percent:
                        Number(attendance?.total ?? 0) > 0
                            ? (
                                  ((Number(attendance?.total ?? 0) - Number(attendance?.sick ?? 0)) /
                                      Number(attendance?.total ?? 0)) *
                                  100
                              ).toFixed(1)
                            : 0,
                },
            })
        );
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}
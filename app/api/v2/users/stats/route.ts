import { NextResponse } from "next/server";
import { queryOne } from "@/utils/mysql";
import { getSession } from "@/utils/session";

// Получение статистики о группе пользователя
export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false }, { status: 401 });

        // 1. Считаем общее кол-во групп и студентов
        const counts = await queryOne(`
            SELECT 
                COUNT(DISTINCT g.id) as groupsCount,
                COUNT(DISTINCT s.id) as studentsCount
            FROM \`groups\` g
            LEFT JOIN students s ON s.fk_group = g.id
            WHERE g.fk_user = ?
        `, [session.uid]);

        // 2. Считаем средний балл по всем управляемым группам
        const grades = await queryOne(`
            SELECT AVG(average_score) as avgGrade
            FROM grades gr
            JOIN \`groups\` g ON gr.fk_group = g.id
            WHERE g.fk_user = ?
        `, [session.uid]);

        // 3. Считаем посещаемость
        const attendance = await queryOne(`
            SELECT 
                SUM(lessons_total) as total,
                SUM(lessons_sick) as sick,
                SUM(late) as late
            FROM attendance a
            JOIN \`groups\` g ON a.fk_group = g.id
            WHERE g.fk_user = ?
        `, [session.uid]);

        return NextResponse.json({
            success: true,
            data: {
                groups: counts?.groupsCount || 0,
                students: counts?.studentsCount || 0,
                avgGrade: Number(grades?.avgGrade || 0).toFixed(2),
                attendance: {
                    total: attendance?.total || 0,
                    sick: attendance?.sick || 0,
                    late: attendance?.late || 0,
                    percent: attendance?.total > 0
                        ? (((attendance?.total - attendance?.sick) / attendance?.total) * 100).toFixed(1)
                        : 0
                }
            }
        });
    } catch (error) {
        console.error("Ошибка работы API", error);
        const errorMessage =
            error instanceof Error ? error.message : "Неизвестная ошибка сервера";

        return NextResponse.json(
            {
                success: false,
                message: "Внутренняя ошибка сервера",
                error: {
                    message: errorMessage,
                    code: "SERVER_ERROR",
                },
            },
            { status: 500 }
        );
    }
}
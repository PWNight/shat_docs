import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/utils/mysql";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const periodSemester = searchParams.get('periodSemester');

        let sqlQuery = `SELECT full_name as fullName, subjects_json as subjects, average_score as averageScore, period_semester as periodSemester
             FROM grades WHERE fk_group = ?`;

        const queryParams: (string | number)[] = [id];

        if (periodSemester) {
            sqlQuery += ` AND period_semester = ?`;
            queryParams.push(parseInt(periodSemester));
        }

        const rows = await query(sqlQuery, queryParams);

        const data = rows.map(row => ({
            ...row,
            subjects: typeof row.subjects === 'string' ? JSON.parse(row.subjects) : row.subjects
        }));

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { groupId, students } = await request.json();

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
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

// Удаление записей успеваемости за конкретный период
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const periodSemester = searchParams.get('periodSemester');

        if (!periodSemester) {
            return NextResponse.json({ success: false, message: "Не указан период для удаления" }, { status: 400 });
        }

        await execute(`DELETE FROM grades WHERE fk_group = ? AND period_semester = ?`, [id, parseInt(periodSemester)]);

        return NextResponse.json({ success: true, message: "Записи удалены" });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/utils/mysql";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const rows = await query(
            `SELECT full_name as fullName, subjects_json as subjects, average_score as averageScore
             FROM grades WHERE fk_group = ?`, [id]
        );

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
                `INSERT INTO grades (fk_group, full_name, subjects_json, average_score)
                 VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        subjects_json = VALUES(subjects_json),
                        average_score = VALUES(average_score)`,
                [groupId, student.fullName, JSON.stringify(student.subjects), student.averageScore]
            );
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
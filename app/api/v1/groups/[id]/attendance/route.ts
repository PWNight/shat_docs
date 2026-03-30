import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/utils/mysql";
import { getSession } from "@/utils/session";

export async function GET(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    try {
        const userData = await getSession();
        if (!userData) return NextResponse.json({ success: false, message: "Нет доступа" }, { status: 401 });

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
        
        const params_arr: any[] = [id];
        
        if (periodMonth) {
            query += ` AND period_month = ?`;
            params_arr.push(parseInt(periodMonth));
        }

        const rows = await execute(query, params_arr);

        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const userData = await getSession();
        if (!userData) return NextResponse.json({ success: false, message: "Нет доступа" }, { status: 401 });

        const { groupId, students } = await request.json();

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
                    groupId, student.fullName, student.fullDaysTotal,
                    student.fullDaysSick, student.lessonsTotal,
                    student.lessonsSick, student.late, student.periodMonth || null
                ]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
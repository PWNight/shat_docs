import { query, queryOne } from "@/utils/sqlite";

/** Статистика по одной группе (корректные агрегаты без раздувания JOIN). */
export type GroupStats = {
    id: number;
    name: string;
    students_count: number;
    grades_periods: number;
    attendance_periods: number;
    avg_grade: number | null;
    excellent_students: number;
    at_risk_students: number;
    lessons_missed: number;
    lessons_sick: number;
    late_total: number;
    days_missed: number;
    days_sick: number;
};

type GroupStatsRow = {
    id: number;
    name: string;
    students_count: number;
    grades_periods: number;
    attendance_periods: number;
    avg_grade: number | null;
    excellent_students: number;
    at_risk_students: number;
    lessons_missed: number;
    lessons_sick: number;
    late_total: number;
    days_missed: number;
    days_sick: number;
};

const GROUP_STATS_BODY = `
    g.id,
    g.name,
    (SELECT COUNT(*) FROM students s WHERE s.fk_group = g.id) AS students_count,
    (SELECT COUNT(DISTINCT gr.period_semester) FROM grades gr WHERE gr.fk_group = g.id AND gr.period_semester IS NOT NULL) AS grades_periods,
    (SELECT COUNT(DISTINCT a.period_month) FROM attendance a WHERE a.fk_group = g.id AND a.period_month IS NOT NULL) AS attendance_periods,
    (SELECT ROUND(AVG(gr.average_score), 2) FROM grades gr WHERE gr.fk_group = g.id) AS avg_grade,
    (
        SELECT COUNT(*) FROM (
            SELECT gr.full_name
            FROM grades gr
            WHERE gr.fk_group = g.id
            GROUP BY gr.full_name
            HAVING AVG(gr.average_score) >= 4.5
        )
    ) AS excellent_students,
    (
        SELECT COUNT(*) FROM (
            SELECT gr.full_name
            FROM grades gr
            WHERE gr.fk_group = g.id
            GROUP BY gr.full_name
            HAVING AVG(gr.average_score) < 3.5
        )
    ) AS at_risk_students,
    (SELECT COALESCE(SUM(a.lessons_total), 0) FROM attendance a WHERE a.fk_group = g.id) AS lessons_missed,
    (SELECT COALESCE(SUM(a.lessons_sick), 0) FROM attendance a WHERE a.fk_group = g.id) AS lessons_sick,
    (SELECT COALESCE(SUM(a.late), 0) FROM attendance a WHERE a.fk_group = g.id) AS late_total,
    (SELECT COALESCE(SUM(a.full_days_total), 0) FROM attendance a WHERE a.fk_group = g.id) AS days_missed,
    (SELECT COALESCE(SUM(a.full_days_sick), 0) FROM attendance a WHERE a.fk_group = g.id) AS days_sick
`;

function normalizeGroupStats(row: GroupStatsRow): GroupStats {
    return {
        id: Number(row.id),
        name: row.name,
        students_count: Number(row.students_count ?? 0),
        grades_periods: Number(row.grades_periods ?? 0),
        attendance_periods: Number(row.attendance_periods ?? 0),
        avg_grade: row.avg_grade != null ? Number(row.avg_grade) : null,
        excellent_students: Number(row.excellent_students ?? 0),
        at_risk_students: Number(row.at_risk_students ?? 0),
        lessons_missed: Number(row.lessons_missed ?? 0),
        lessons_sick: Number(row.lessons_sick ?? 0),
        late_total: Number(row.late_total ?? 0),
        days_missed: Number(row.days_missed ?? 0),
        days_sick: Number(row.days_sick ?? 0),
    };
}

export async function fetchAllGroupStats(): Promise<GroupStats[]> {
    const rows = await query<GroupStatsRow>(
        `SELECT ${GROUP_STATS_BODY} FROM "groups" g ORDER BY g.id DESC`
    );
    return rows.map(normalizeGroupStats);
}

export async function fetchGroupStatsById(groupId: number): Promise<GroupStats | null> {
    const row = await queryOne<GroupStatsRow>(
        `SELECT ${GROUP_STATS_BODY} FROM "groups" g WHERE g.id = ?`,
        [groupId]
    );
    return row ? normalizeGroupStats(row) : null;
}

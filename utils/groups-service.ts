import "server-only";

import { execute, query, queryOne, transaction } from "@/utils/sqlite";
import { getSession } from "@/utils/session";
import { getActorBySessionUid } from "@/utils/admin";
import { canAccessGroup, getGroupById, teacherHasGroup } from "@/utils/group-access";
import { fetchGroupStatsById, type GroupStats } from "@/utils/group-stats";
import type { AttendanceStudent, GradeStudent, Group, Student, TeacherStats, UserProfile } from "@/utils/interfaces";

type ServiceError = { success: false; message: string; code?: string; status?: number };
type ServiceOk<T = unknown> = { success: true; data?: T; message?: string };

export type ServiceResult<T = unknown> = ServiceOk<T> | ServiceError;

async function requireCurrentUser(): Promise<
    | { success: true; uid: number }
    | ServiceError
> {
    const session = await getSession();
    if (!session) {
        return { success: false, message: "Необходима авторизация", code: "UNAUTHORIZED", status: 401 };
    }
    return { success: true, uid: session.uid };
}

async function requireGroupForUser(groupId: string | number): Promise<
    | { success: true; uid: number; group: NonNullable<Awaited<ReturnType<typeof getGroupById>>> }
    | ServiceError
> {
    const auth = await requireCurrentUser();
    if (!auth.success) return auth;

    const group = await getGroupById(groupId);
    if (!group) {
        return { success: false, message: "Группа не найдена", code: "NOT_FOUND", status: 404 };
    }

    const allowed = await canAccessGroup(auth.uid, group);
    if (!allowed) {
        return { success: false, message: "Нет доступа к этой группе", code: "FORBIDDEN", status: 403 };
    }

    return { success: true, uid: auth.uid, group };
}

async function resolveStudentId(groupId: number, fullName: string): Promise<number | null> {
    const row = await queryOne<{ id: number }>(
        "SELECT id FROM students WHERE fk_group = ? AND full_name = ? LIMIT 1",
        [groupId, fullName]
    );
    return row?.id ?? null;
}

export async function listGroupsForCurrentUser(): Promise<ServiceResult<Group[]>> {
    const auth = await requireCurrentUser();
    if (!auth.success) return auth;

    const actor = await getActorBySessionUid(auth.uid);
    const isAdmin = Boolean(actor?.canAccessAdmin);

    const groups = isAdmin
        ? await query<Group>(
              'SELECT "groups".id, name, "groups".created_by, fk_user, users.full_name AS leader FROM "groups" JOIN users ON fk_user = users.id',
          )
        : await query<Group>(
              'SELECT "groups".id, name, "groups".created_by, fk_user, users.full_name AS leader FROM "groups" JOIN users ON fk_user = users.id WHERE fk_user = ?',
              [auth.uid],
          );

    return { success: true, data: groups, message: "Успешно" };
}

export async function getGroupForCurrentUser(id: string): Promise<ServiceResult<Group>> {
    const access = await requireGroupForUser(id);
    if (!access.success) return access;

    const group = await queryOne<Group>(
        'SELECT "groups".id, name, "groups".created_by, fk_user, users.full_name AS leader FROM "groups" JOIN users ON fk_user = users.id WHERE "groups".id = ?',
        [access.group.id]
    );

    if (!group) {
        return { success: false, message: "Группа не найдена", code: "NOT_FOUND", status: 404 };
    }

    return { success: true, data: group, message: "Успешно" };
}

export async function createGroupForCurrentUser(name: string, fk_user: string): Promise<ServiceResult> {
    const auth = await requireCurrentUser();
    if (!auth.success) return auth;

    const teacherId = Number(fk_user);
    if (!Number.isFinite(teacherId) || teacherId <= 0) {
        return { success: false, message: "Некорректный id преподавателя", code: "BAD_REQUEST", status: 400 };
    }

    const user = await queryOne("SELECT email FROM users WHERE id = ? LIMIT 1", [teacherId]);
    if (!user) {
        return { success: false, message: `Пользователь с айди ${teacherId} не найден`, code: "NOT_FOUND", status: 404 };
    }

    const existing = await queryOne('SELECT * FROM "groups" WHERE name = ? LIMIT 1', [name]);
    if (existing) {
        return { success: false, message: `Группа с названием ${name} уже существует`, code: "BAD_REQUEST", status: 400 };
    }

    if (await teacherHasGroup(teacherId)) {
        return { success: false, message: "У преподавателя уже есть закреплённая группа", code: "BAD_REQUEST", status: 400 };
    }

    await execute('INSERT INTO "groups" (name, fk_user) VALUES (?, ?)', [name, teacherId]);
    return { success: true, message: `Группа ${name} успешно создана` };
}

export async function updateGroupForCurrentUser(id: string, data: { name?: string; fk_user?: string }): Promise<ServiceResult> {
    const access = await requireGroupForUser(id);
    if (!access.success) return access;

    if (access.group.fk_user !== access.uid) {
        const actor = await getActorBySessionUid(access.uid);
        if (!actor?.canAccessAdmin) {
            return { success: false, message: "Вы не можете обновить эту группу", code: "FORBIDDEN", status: 403 };
        }
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
            updates.push(`${key} = ?`);
            values.push(value);
        }
    }

    if (updates.length === 0) {
        return { success: false, message: "Данные из формы совпадают с данными в базе", code: "BAD_REQUEST", status: 400 };
    }

    values.push(access.group.id);
    await execute(`UPDATE "groups" SET ${updates.join(", ")} WHERE id = ?`, values);
    return { success: true, message: "Группа успешно обновлена" };
}

export async function deleteGroupForCurrentUser(id: string): Promise<ServiceResult> {
    const access = await requireGroupForUser(id);
    if (!access.success) return access;

    if (access.group.fk_user !== access.uid) {
        return { success: false, message: "Вы не можете удалить эту группу", code: "FORBIDDEN", status: 403 };
    }

    await execute('DELETE FROM "groups" WHERE id = ?', [access.group.id]);
    return { success: true, message: `Группа с айди ${id} успешно удалена` };
}

export async function getGroupStatsForCurrentUser(id: string): Promise<ServiceResult<GroupStats>> {
    const access = await requireGroupForUser(id);
    if (!access.success) return access;

    const stats = await fetchGroupStatsById(access.group.id);
    if (!stats) {
        return { success: false, message: "Группа не найдена", code: "NOT_FOUND", status: 404 };
    }

    return { success: true, data: stats, message: "Успешно" };
}

export async function listStudentsForCurrentUser(groupId: string): Promise<ServiceResult<Student[]>> {
    const access = await requireGroupForUser(groupId);
    if (!access.success) return access;

    const students = await query<Student>("SELECT * FROM students WHERE fk_group = ?", [access.group.id]);
    return { success: true, data: students };
}

export async function createStudentsForCurrentUser(
    groupId: string,
    students: Array<{ fullName: string }>
): Promise<ServiceResult> {
    const access = await requireGroupForUser(groupId);
    if (!access.success) return access;

    for (const student of students) {
        await execute(
            "INSERT INTO students (full_name, fk_group) VALUES (?, ?) ON CONFLICT(full_name, fk_group) DO UPDATE SET full_name = excluded.full_name",
            [student.fullName, access.group.id]
        );
    }

    return { success: true, message: "Студенты добавлены" };
}

export async function updateStudentForCurrentUser(
    groupId: string,
    studentId: number,
    newName: string
): Promise<ServiceResult> {
    const access = await requireGroupForUser(groupId);
    if (!access.success) return access;

    const oldStudent = await queryOne<{ full_name: string }>(
        "SELECT full_name FROM students WHERE id = ? AND fk_group = ?",
        [studentId, access.group.id]
    );
    if (!oldStudent) {
        return { success: false, message: "Студент не найден в этой группе", code: "NOT_FOUND", status: 404 };
    }

    const oldName = oldStudent.full_name;
    await transaction((db) => {
        db.prepare("UPDATE students SET full_name = ? WHERE id = ? AND fk_group = ?").run(newName, studentId, access.group.id);
        db.prepare("UPDATE attendance SET full_name = ?, fk_student = ? WHERE fk_group = ? AND full_name = ?").run(
            newName,
            studentId,
            access.group.id,
            oldName
        );
        db.prepare("UPDATE grades SET full_name = ?, fk_student = ? WHERE fk_group = ? AND full_name = ?").run(
            newName,
            studentId,
            access.group.id,
            oldName
        );
    });

    return { success: true, message: "Данные студента и связанные записи обновлены" };
}

export async function deleteStudentForCurrentUser(groupId: string, studentId: number): Promise<ServiceResult> {
    const access = await requireGroupForUser(groupId);
    if (!access.success) return access;

    const student = await queryOne<{ full_name: string }>(
        "SELECT full_name FROM students WHERE id = ? AND fk_group = ?",
        [studentId, access.group.id]
    );
    if (!student) {
        return { success: false, message: "Студент не найден", code: "NOT_FOUND", status: 404 };
    }

    const studentName = student.full_name;
    await transaction((db) => {
        db.prepare("DELETE FROM students WHERE id = ? AND fk_group = ?").run(studentId, access.group.id);
        db.prepare("DELETE FROM attendance WHERE fk_group = ? AND full_name = ?").run(access.group.id, studentName);
        db.prepare("DELETE FROM grades WHERE fk_group = ? AND full_name = ?").run(access.group.id, studentName);
    });

    return { success: true, message: "Студент и все связанные данные успешно удалены" };
}

export async function getAttendanceForCurrentUser(
    groupId: string,
    periodMonth?: number
): Promise<ServiceResult<AttendanceStudent[]>> {
    const access = await requireGroupForUser(groupId);
    if (!access.success) return access;

    let sql = `SELECT id as number, full_name as fullName, full_days_total as fullDaysTotal,
        full_days_sick as fullDaysSick, lessons_total as lessonsTotal, lessons_sick as lessonsSick,
        late, period_month as periodMonth FROM attendance WHERE fk_group = ?`;
    const params: number[] = [access.group.id];

    if (periodMonth !== undefined) {
        sql += " AND period_month = ?";
        params.push(periodMonth);
    }

    const rows = await query<AttendanceStudent>(sql, params);
    return { success: true, data: rows };
}

export async function saveAttendanceForCurrentUser(
    groupId: string,
    students: AttendanceStudent[]
): Promise<ServiceResult> {
    const access = await requireGroupForUser(groupId);
    if (!access.success) return access;

    for (const student of students) {
        const fkStudent = await resolveStudentId(access.group.id, student.fullName);
        await execute(
            `INSERT INTO attendance
            (fk_group, full_name, fk_student, full_days_total, full_days_sick, lessons_total, lessons_sick, late, period_month)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(fk_group, full_name, period_month) DO UPDATE SET
            fk_student = excluded.fk_student,
            full_days_total = excluded.full_days_total,
            full_days_sick = excluded.full_days_sick,
            lessons_total = excluded.lessons_total,
            lessons_sick = excluded.lessons_sick,
            late = excluded.late,
            period_month = excluded.period_month,
            updated_at = datetime('now')`,
            [
                access.group.id,
                student.fullName,
                fkStudent,
                student.fullDaysTotal,
                student.fullDaysSick,
                student.lessonsTotal,
                student.lessonsSick,
                student.late,
                student.periodMonth ?? null,
            ]
        );
    }

    return { success: true, message: "Посещаемость обновлена" };
}

export async function deleteAttendancePeriodForCurrentUser(
    groupId: string,
    periodMonth: number
): Promise<ServiceResult> {
    const access = await requireGroupForUser(groupId);
    if (!access.success) return access;

    await execute("DELETE FROM attendance WHERE fk_group = ? AND period_month = ?", [access.group.id, periodMonth]);
    return { success: true, message: "Записи удалены" };
}

export async function getGradesForCurrentUser(
    groupId: string,
    periodSemester?: number
): Promise<ServiceResult<GradeStudent[]>> {
    const access = await requireGroupForUser(groupId);
    if (!access.success) return access;

    let sql = `SELECT full_name as fullName, subjects_json as subjects, average_score as averageScore,
        period_semester as periodSemester FROM grades WHERE fk_group = ?`;
    const params: number[] = [access.group.id];

    if (periodSemester !== undefined) {
        sql += " AND period_semester = ?";
        params.push(periodSemester);
    }

    const rows = await query<{ fullName: string; subjects: string; averageScore: number; periodSemester: number }>(
        sql,
        params
    );

    const data = rows.map((row) => ({
        ...row,
        subjects: typeof row.subjects === "string" ? JSON.parse(row.subjects) : row.subjects,
    })) as GradeStudent[];

    return { success: true, data };
}

export async function saveGradesForCurrentUser(groupId: string, students: GradeStudent[]): Promise<ServiceResult> {
    const access = await requireGroupForUser(groupId);
    if (!access.success) return access;

    for (const student of students) {
        const fkStudent = await resolveStudentId(access.group.id, student.fullName);
        await execute(
            `INSERT INTO grades (fk_group, full_name, fk_student, subjects_json, average_score, period_semester)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(fk_group, full_name, period_semester) DO UPDATE SET
                    fk_student = excluded.fk_student,
                    subjects_json = excluded.subjects_json,
                    average_score = excluded.average_score,
                    period_semester = excluded.period_semester,
                    updated_at = datetime('now')`,
            [
                access.group.id,
                student.fullName,
                fkStudent,
                JSON.stringify(student.subjects),
                student.averageScore,
                student.periodSemester ?? null,
            ]
        );
    }

    return { success: true, message: "Успеваемость обновлена" };
}

export async function deleteGradesPeriodForCurrentUser(
    groupId: string,
    periodSemester: number
): Promise<ServiceResult> {
    const access = await requireGroupForUser(groupId);
    if (!access.success) return access;

    await execute("DELETE FROM grades WHERE fk_group = ? AND period_semester = ?", [access.group.id, periodSemester]);
    return { success: true, message: "Записи удалены" };
}

export async function listUsersForCurrentUser(): Promise<ServiceResult<Array<{ id: number; full_name: string }>>> {
    const auth = await requireCurrentUser();
    if (!auth.success) return auth;

    const users = await query<{ id: number; full_name: string }>(
        "SELECT id, full_name FROM users WHERE registration_status = 'approved' ORDER BY full_name ASC"
    );
    return { success: true, data: users };
}

export async function getUserProfileForCurrentUser(id: number): Promise<ServiceResult<UserProfile>> {
    const auth = await requireCurrentUser();
    if (!auth.success) return auth;

    const user = await queryOne<UserProfile>(
        "SELECT id, email, full_name, isAdmin, canAccessAdmin, registration_status, created_by FROM users WHERE id = ? LIMIT 1",
        [id]
    );
    if (!user) {
        return { success: false, message: "Пользователь не найден", code: "NOT_FOUND", status: 404 };
    }

    return { success: true, data: user };
}

export async function getTeacherStatsForCurrentUser(): Promise<ServiceResult<TeacherStats>> {
    const auth = await requireCurrentUser();
    if (!auth.success) return auth;

    type CountsRow = { studentsCount: number };
    type GradesRow = { avgGrade: number | null };
    type AttendanceRow = { total: number | null; sick: number | null; late: number | null };

    const counts = await queryOne<CountsRow>(
        `SELECT COUNT(DISTINCT s.id) as studentsCount
         FROM "groups" g
         LEFT JOIN students s ON s.fk_group = g.id
         WHERE g.fk_user = ?`,
        [auth.uid]
    );

    const grades = await queryOne<GradesRow>(
        `SELECT AVG(average_score) as avgGrade
         FROM grades gr
         JOIN "groups" g ON gr.fk_group = g.id
         WHERE g.fk_user = ?`,
        [auth.uid]
    );

    const attendance = await queryOne<AttendanceRow>(
        `SELECT SUM(lessons_total) as total, SUM(lessons_sick) as sick, SUM(late) as late
         FROM attendance a
         JOIN "groups" g ON a.fk_group = g.id
         WHERE g.fk_user = ?`,
        [auth.uid]
    );

    const totalLessons = Number(attendance?.total ?? 0);
    const sickLessons = Number(attendance?.sick ?? 0);

    return {
        success: true,
        data: {
            students: counts?.studentsCount || 0,
            avgGrade: Number(grades?.avgGrade || 0).toFixed(2),
            attendance: {
                percent:
                    totalLessons > 0
                        ? Number((((totalLessons - sickLessons) / totalLessons) * 100).toFixed(1))
                        : 0,
                late: Number(attendance?.late ?? 0),
            },
        },
    };
}

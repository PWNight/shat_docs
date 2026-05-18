"use server";

import { headers } from "next/headers";
import {
    GroupFormSchema, GroupFormState,
    LoginFormSchema, LoginFormState,
    RegisterFormSchema, RegisterFormState
} from "@/utils/validation";
import { loginUser, registerUser } from "@/utils/auth-service";
import { apiPatch } from "@/utils/http-client";
import { AttendanceStudent, GradeStudent, Group, Student, TeacherStats, UserProfile } from "@/utils/interfaces";
import type { GroupStats } from "@/utils/group-stats";
import { ApiResponseError } from "@/utils/functions";
import { logger } from "@/utils/logger";
import { isValidEntityId, isValidMonth, isValidSemester } from "@/utils/validation";
import { checkRateLimit, getClientIdentifierFromHeaders } from "@/utils/rate-limit";
import {
    createGroupForCurrentUser,
    createStudentsForCurrentUser,
    deleteAttendancePeriodForCurrentUser,
    deleteGradesPeriodForCurrentUser,
    deleteGroupForCurrentUser,
    deleteStudentForCurrentUser,
    getAttendanceForCurrentUser,
    getGradesForCurrentUser,
    getGroupForCurrentUser,
    getGroupStatsForCurrentUser,
    getTeacherStatsForCurrentUser,
    getUserProfileForCurrentUser,
    listGroupsForCurrentUser,
    listStudentsForCurrentUser,
    listUsersForCurrentUser,
    saveAttendanceForCurrentUser,
    saveGradesForCurrentUser,
    updateGroupForCurrentUser,
    updateStudentForCurrentUser,
    type ServiceResult,
} from "@/utils/groups-service";

function toErrorResult(error: unknown, fallback: string) {
    if (error instanceof ApiResponseError) {
        return { success: false, message: error.message, code: error.code, status: error.status };
    }

    if (error instanceof Error) {
        logger.error("Handler request failed", { message: error.message });
        return { success: false, message: error.message };
    }

    return { success: false, message: fallback };
}

type HandlerResult<T = unknown> =
    | { success: true; data?: T; message?: string }
    | { success: false; message: string; code?: string; status?: number };

function fromService<T>(result: ServiceResult<T>): HandlerResult<T> {
    if (!result.success) {
        return { success: false, message: result.message, code: result.code, status: result.status };
    }
    return { success: true, data: result.data, message: result.message };
}

export async function Login(_prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
    const parsed = LoginFormSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return {
            success: false,
            message: "Проверьте введённые данные",
            fieldErrors: parsed.error.flatten().fieldErrors,
            values: {
                email: formData.get("email") as string || "",
            },
        };
    }

    const { email, password } = parsed.data;

    const headerStore = await headers();
    const clientId = getClientIdentifierFromHeaders(headerStore);
    const rateLimitResult = checkRateLimit(`login:${clientId}`, 5, 15 * 60 * 1000);
    if (!rateLimitResult.success) {
        return {
            success: false,
            message: "Слишком много попыток входа. Попробуйте позже.",
            values: { email },
        };
    }

    const result = await loginUser(email, password);
    if (!result.success) {
        return {
            success: false,
            message: result.message,
            values: { email },
        };
    }

    return { success: true };
}

export async function Register(_prevState: RegisterFormState, formData: FormData): Promise<RegisterFormState> {
    const parsed = RegisterFormSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return {
            success: false,
            message: "Проверьте введённые данные",
            fieldErrors: parsed.error.flatten().fieldErrors,
            values: {
                email: formData.get("email") as string || "",
                full_name: formData.get("full_name") as string || "",
            },
        };
    }

    const { email, full_name, password } = parsed.data;

    const result = await registerUser(email, full_name, password);
    if (!result.success) {
        return {
            success: false,
            message: result.message,
            values: { email, full_name },
        };
    }

    return {
        success: true,
        requiresApproval: true,
        message: result.message,
    };
}

export async function CreateGroup(_state: GroupFormState, formData: FormData): Promise<GroupFormState> {
    try {
        const parsed = GroupFormSchema.safeParse(Object.fromEntries(formData));
        if (!parsed.success) {
            return { success: false, message: "Ошибка валидации", fieldErrors: parsed.error.flatten().fieldErrors };
        }

        const { name, fk_user } = parsed.data;
        const result = await createGroupForCurrentUser(name, fk_user);
        if (!result.success) {
            return { success: false, message: result.message };
        }
        return { success: true, message: result.message };
    } catch (error) {
        const err = toErrorResult(error, "Произошла ошибка");
        return { success: false, message: err.message };
    }
}

export async function UpdateGroup(id: string, data: object): Promise<HandlerResult> {
    if (!isValidEntityId(id)) return { success: false, message: "Некорректный id группы" };
    try {
        return fromService(await updateGroupForCurrentUser(id, data as { name?: string; fk_user?: string }));
    } catch (error) {
        return toErrorResult(error, "Ошибка обновления");
    }
}

export async function DeleteGroup(id: string): Promise<HandlerResult> {
    if (!isValidEntityId(id)) return { success: false, message: "Некорректный id группы" };
    try {
        return fromService(await deleteGroupForCurrentUser(id));
    } catch (error) {
        return toErrorResult(error, "Ошибка обновления");
    }
}

export async function SaveAttendance(groupId: string, students: AttendanceStudent[]): Promise<HandlerResult> {
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    try {
        return fromService(await saveAttendanceForCurrentUser(groupId, students));
    } catch (error) {
        return toErrorResult(error, "Ошибка при сохранении посещаемости");
    }
}

export async function GetAttendance(groupId: string, periodMonth?: number): Promise<HandlerResult<AttendanceStudent[]>> {
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    if (periodMonth !== undefined && !isValidMonth(periodMonth)) return { success: false, message: "Некорректный месяц" };
    try {
        return fromService(await getAttendanceForCurrentUser(groupId, periodMonth));
    } catch (error) {
        return toErrorResult(error, "Ошибка при получении посещаемости");
    }
}

export async function GetAllGroups(): Promise<HandlerResult<Group[]>> {
    try {
        return fromService(await listGroupsForCurrentUser());
    } catch (error) {
        return toErrorResult(error, "Ошибка при получении списка групп");
    }
}

export async function GetGroup(id: string): Promise<HandlerResult<Group>> {
    if (!isValidEntityId(id)) return { success: false, message: "Некорректный id группы" };
    try {
        return fromService(await getGroupForCurrentUser(id));
    } catch (error) {
        return toErrorResult(error, "Ошибка при получении группы");
    }
}

export async function GetUsersList(): Promise<HandlerResult<{ id: number; full_name: string }[]>> {
    try {
        return fromService(await listUsersForCurrentUser());
    } catch (error) {
        return toErrorResult(error, "Ошибка при получении списка пользователей");
    }
}

export async function GetUser(id: number): Promise<HandlerResult<UserProfile>> {
    if (!isValidEntityId(id)) return { success: false, message: "Некорректный id пользователя" };
    try {
        return fromService(await getUserProfileForCurrentUser(id));
    } catch (error) {
        return toErrorResult(error, "Ошибка при получении профиля пользователя");
    }
}

export async function GetStudents(groupId: string): Promise<HandlerResult<Student[]>> {
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    try {
        return fromService(await listStudentsForCurrentUser(groupId));
    } catch (error) {
        return toErrorResult(error, "Ошибка при получении списка студентов");
    }
}

export async function CreateStudents(groupId: string, students: { fullName: string }[]): Promise<HandlerResult> {
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    try {
        return fromService(await createStudentsForCurrentUser(groupId, students));
    } catch (error) {
        return toErrorResult(error, "Ошибка при создании студентов");
    }
}

export async function UpdateStudent(groupId: string, studentId: number, newName: string): Promise<HandlerResult> {
    if (!isValidEntityId(groupId) || !isValidEntityId(studentId)) {
        return { success: false, message: "Некорректный id студента или группы" };
    }
    try {
        return fromService(await updateStudentForCurrentUser(groupId, studentId, newName));
    } catch (error) {
        return toErrorResult(error, "Ошибка при обновлении студента");
    }
}

export async function DeleteStudent(groupId: string, studentId: number): Promise<HandlerResult> {
    if (!isValidEntityId(groupId) || !isValidEntityId(studentId)) {
        return { success: false, message: "Некорректный id студента или группы" };
    }
    try {
        return fromService(await deleteStudentForCurrentUser(groupId, studentId));
    } catch (error) {
        return toErrorResult(error, "Ошибка при удалении студента");
    }
}

export async function SaveGrades(groupId: string, students: GradeStudent[]): Promise<HandlerResult> {
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    try {
        return fromService(await saveGradesForCurrentUser(groupId, students));
    } catch (error) {
        return toErrorResult(error, "Ошибка при сохранении оценок");
    }
}

export async function DeleteAttendancePeriod(groupId: string, periodMonth: number): Promise<HandlerResult> {
    if (!isValidEntityId(groupId) || !isValidMonth(periodMonth)) {
        return { success: false, message: "Некорректный период или id группы" };
    }
    try {
        return fromService(await deleteAttendancePeriodForCurrentUser(groupId, periodMonth));
    } catch (error) {
        return toErrorResult(error, "Ошибка при удалении посещаемости за период");
    }
}

export async function DeleteGradesPeriod(groupId: string, periodSemester: number): Promise<HandlerResult> {
    if (!isValidEntityId(groupId) || !isValidSemester(periodSemester)) {
        return { success: false, message: "Некорректный период или id группы" };
    }
    try {
        return fromService(await deleteGradesPeriodForCurrentUser(groupId, periodSemester));
    } catch (error) {
        return toErrorResult(error, "Ошибка при удалении оценок за период");
    }
}

export async function GetGrades(groupId: string, periodSemester?: number): Promise<HandlerResult<GradeStudent[]>> {
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    if (periodSemester !== undefined && !isValidSemester(periodSemester)) {
        return { success: false, message: "Некорректный семестр" };
    }
    try {
        return fromService(await getGradesForCurrentUser(groupId, periodSemester));
    } catch (error) {
        return toErrorResult(error, "Ошибка при получении оценок");
    }
}

export async function UpdateProfile(data: object): Promise<HandlerResult> {
    try {
        return await apiPatch("/api/users", data);
    } catch (error) {
        return toErrorResult(error, "Ошибка при обновлении профиля");
    }
}

export async function GetGroupStats(id: string): Promise<HandlerResult<GroupStats>> {
    if (!isValidEntityId(id)) return { success: false, message: "Некорректный id группы" };
    try {
        return fromService(await getGroupStatsForCurrentUser(id));
    } catch (error) {
        return toErrorResult(error, "Ошибка при получении статистики группы");
    }
}

export async function GetTeacherStats(): Promise<HandlerResult<TeacherStats>> {
    try {
        return fromService(await getTeacherStatsForCurrentUser());
    } catch (error) {
        return toErrorResult(error, "Ошибка при получении статистики преподавателя");
    }
}

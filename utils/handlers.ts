import {
    GroupFormSchema, GroupFormState,
    LoginFormSchema, LoginFormState,
    RegisterFormSchema, RegisterFormState
} from "@/utils/definitions";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/utils/http-client";
import {z} from "zod";
import {AttendanceStudent, GradeStudent, Group, Student, TeacherStats, UserProfile} from "@/utils/interfaces";
import { ApiResponseError } from "@/utils/functions";
import { logger } from "@/utils/logger";
import { isValidEntityId, isValidMonth, isValidSemester } from "@/utils/validators";

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

// Код авторизации
export async function Login(_prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
    // Проверяем полученные поля
    const parsed = LoginFormSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return {
            success: false,
            message: "Проверьте введённые данные",
            fieldErrors: z.flattenError(parsed.error).fieldErrors,
            values: {
                email: formData.get("email") as string || "",
            },
        };
    }

    // Получаем данные из формы
    const { email, password } = parsed.data;

    try {
        // Отправляем POST запрос в авторизацию
        await apiPost('/api/v2/auth/login', { email, password });

        // Возвращаем успех
        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Ошибка авторизации";

        return {
            success: false,
            message,
            values: {
                email: email || "",
            },
        };
    }
}

// Код авторизации
export async function Register(_prevState: RegisterFormState, formData: FormData): Promise<RegisterFormState> {
    // Проверяем полученные поля
    const parsed = RegisterFormSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return {
            success: false,
            message: "Проверьте введённые данные",
            fieldErrors: z.flattenError(parsed.error).fieldErrors,
            values: {
                email: formData.get("email") as string || "",
                full_name: formData.get("full_name") as string || "",
            },
        };
    }

    // Получаем данные из формы
    const { email, full_name, password } = parsed.data;

    try {
    // Отправляем POST запрос в регистрацию
    const response = await apiPost<{ message?: string }>('/api/v2/auth/register', { email, full_name, password });

    // Возвращаем успех
    return { success: true, requiresApproval: true, message: response.message || "Заявка отправлена" };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Ошибка авторизации";

        return {
            success: false,
            message,
            values: {
                email: email || "",
                full_name: full_name || "",
            },
        };
    }
}

// Код создания группы
export async function CreateGroup(_state: GroupFormState, formData: FormData) {
    try {
        // Проверяем полученные поля
        const parsed = GroupFormSchema.safeParse(Object.fromEntries(formData));
        if (!parsed.success) {
            return { message: "Ошибка валидации", fieldErrors: z.flattenError(parsed.error).fieldErrors }
        }

        // Получаем данные из формы
        const { name, fk_user } = parsed.data;

        // Отправляем POST запрос в авторизацию
        await apiPost('/api/v2/groups', { name, fk_user });

        // Возвращаем успех и redirectTo
        return { success: true };
    } catch (error) {
        return toErrorResult(error, "Произошла ошибка");
    }
}

export async function UpdateGroup(id: string, data: object): Promise<HandlerResult> {
    if (!isValidEntityId(id)) return { success: false, message: "Некорректный id группы" };
    try {
        return await apiPost(`/api/v2/groups/${id}`, data);
    } catch (error) {
        return toErrorResult(error, "Ошибка обновления");
    }
}

// Код удаления группы
export async function DeleteGroup(id: string): Promise<HandlerResult> {
    if (!isValidEntityId(id)) return { success: false, message: "Некорректный id группы" };
    try {
        return await apiDelete(`/api/v2/groups/${id}`);
    } catch (error) {
        return toErrorResult(error, "Ошибка обновления");
    }
}

export async function SaveAttendance(groupId: string, students: AttendanceStudent[]): Promise<HandlerResult> {
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    try {
        return await apiPost(`/api/v2/groups/${groupId}/attendance`, { groupId, students });
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function GetAttendance(groupId: string, periodMonth?: number): Promise<HandlerResult<AttendanceStudent[]>> {
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    if (periodMonth !== undefined && !isValidMonth(periodMonth)) return { success: false, message: "Некорректный месяц" };
    try {
        return await apiGet(`/api/v2/groups/${groupId}/attendance`, {
            query: { periodMonth },
        });
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function GetAllGroups(): Promise<HandlerResult<Group[]>>{
    try {
        const { data } = await apiGet<{ data?: Group[] }>("/api/v2/groups/");

        return { success: true, message: "Успешно", data }
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function GetGroup(id: string): Promise<HandlerResult<Group>>{
    if (!isValidEntityId(id)) return { success: false, message: "Некорректный id группы" };
    try {
        const { data } = await apiGet<{ data?: Group }>(`/api/v2/groups/${id}`);

        return { success: true, message: "Успешно", data }
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function GetUsersList(): Promise<HandlerResult<{ id: number; full_name: string }[]>> {
    try {
        const { data } = await apiGet<{ data?: { id: number; full_name: string }[] }>('/api/v2/users');

        return { success: true, data };
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function GetUser(id: number): Promise<HandlerResult<UserProfile>> {
    if (!isValidEntityId(id)) return { success: false, message: "Некорректный id пользователя" };
    try {
        const { data } = await apiGet<{ data?: UserProfile }>(`/api/v2/users/${id}`);

        return { success: true, data };
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function GetStudents(groupId: string): Promise<HandlerResult<Student[]>> {
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    try {
        const { data } = await apiGet<{ data?: Student[] }>(`/api/v2/groups/${groupId}/students`);

        return { success: true, data };
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function CreateStudents(groupId: string, students: { fullName: string }[]): Promise<HandlerResult> {
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    try {
        return await apiPost(`/api/v2/groups/${groupId}/students`, { students });
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function UpdateStudent(groupId: string, studentId: number, newName: string): Promise<HandlerResult> {
    if (!isValidEntityId(groupId) || !isValidEntityId(studentId)) return { success: false, message: "Некорректный id студента или группы" };
    try {
        return await apiPatch(`/api/v2/groups/${groupId}/students/${studentId}`, { full_name: newName });
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function DeleteStudent(groupId: string, studentId: number): Promise<HandlerResult> {
    if (!isValidEntityId(groupId) || !isValidEntityId(studentId)) return { success: false, message: "Некорректный id студента или группы" };
    try {
        return await apiDelete(`/api/v2/groups/${groupId}/students/${studentId}`);
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function SaveGrades(groupId: string, students: GradeStudent[]): Promise<HandlerResult> {
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    try {
        return await apiPost(`/api/v2/groups/${groupId}/grades`, { groupId, students });
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function DeleteAttendancePeriod(groupId: string, periodMonth: number): Promise<HandlerResult> {
    if (!isValidEntityId(groupId) || !isValidMonth(periodMonth)) return { success: false, message: "Некорректный период или id группы" };
    try {
        return await apiDelete(`/api/v2/groups/${groupId}/attendance`, { query: { periodMonth } });
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function DeleteGradesPeriod(groupId: string, periodSemester: number): Promise<HandlerResult> {
    if (!isValidEntityId(groupId) || !isValidSemester(periodSemester)) return { success: false, message: "Некорректный период или id группы" };
    try {
        return await apiDelete(`/api/v2/groups/${groupId}/grades`, { query: { periodSemester } });
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function GetGrades(groupId: string, periodSemester?: number): Promise<HandlerResult<GradeStudent[]>> {
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    if (periodSemester !== undefined && !isValidSemester(periodSemester)) return { success: false, message: "Некорректный семестр" };
    try {
        return await apiGet(`/api/v2/groups/${groupId}/grades`, { query: { periodSemester } });
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function UpdateProfile(data: object): Promise<HandlerResult> {
    try {
        return await apiPost('/api/v2/users', data);
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

// Получение статистики преподавателя
export async function GetTeacherStats(): Promise<HandlerResult<TeacherStats>> {
    try {
        const { data, message } = await apiGet<{ data?: TeacherStats; message?: string }>('/api/v2/users/stats');
        return { success: true, data, message };
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}
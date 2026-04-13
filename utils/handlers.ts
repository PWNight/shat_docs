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

// Функция для обработки ошибок
function toErrorResult(error: unknown, fallback: string) {
    // Проверяем, является ли ошибка ошибкой API
    if (error instanceof ApiResponseError) {
        return { success: false, message: error.message, code: error.code, status: error.status };
    }

    // Проверяем, является ли ошибка ошибкой
    if (error instanceof Error) {
        logger.error("Handler request failed", { message: error.message });
        return { success: false, message: error.message };
    }

    // Возвращаем ошибку
    return { success: false, message: fallback };
}

// Тип для результата обработки
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
        await apiPost('/api/auth/login', { email, password });

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
    const response = await apiPost<{ message?: string }>('/api/auth/register', { email, full_name, password });

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
        await apiPost('/api/groups', { name, fk_user });

        // Возвращаем успех и redirectTo
        return { success: true };
    } catch (error) {
        return toErrorResult(error, "Произошла ошибка");
    }
}

// Код обновления группы
export async function UpdateGroup(id: string, data: object): Promise<HandlerResult> {
    // Проверяем, является ли id группы корректным
    if (!isValidEntityId(id)) return { success: false, message: "Некорректный id группы" };
    try {
        // Отправляем PATCH запрос в обновление группы
        return await apiPatch(`/api/groups/${id}`, data);
    } catch (error) {
        // Возвращаем ошибку
        return toErrorResult(error, "Ошибка обновления");
    }
}

// Код удаления группы
export async function DeleteGroup(id: string): Promise<HandlerResult> {
    if (!isValidEntityId(id)) return { success: false, message: "Некорректный id группы" };
    try {
        return await apiDelete(`/api/groups/${id}`);
    } catch (error) {
        return toErrorResult(error, "Ошибка обновления");
    }
}

// Код сохранения посещаемости
export async function SaveAttendance(groupId: string, students: AttendanceStudent[]): Promise<HandlerResult> {
    // Проверяем, является ли id группы корректным
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    try {
        // Отправляем POST запрос в сохранение посещаемости
        return await apiPost(`/api/groups/${groupId}/attendance`, { groupId, students });
    } catch (error) {
        // Возвращаем ошибку
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

// Код получения посещаемости
export async function GetAttendance(groupId: string, periodMonth?: number): Promise<HandlerResult<AttendanceStudent[]>> {
    // Проверяем, является ли id группы корректным
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    if (periodMonth !== undefined && !isValidMonth(periodMonth)) return { success: false, message: "Некорректный месяц" };
    try {
        // Отправляем GET запрос в получение посещаемости
        return await apiGet(`/api/groups/${groupId}/attendance`, {
            query: { periodMonth },
        });
    } catch (error) {
        // Возвращаем ошибку
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

// Код получения всех групп
export async function GetAllGroups(): Promise<HandlerResult<Group[]>>{
    // Отправляем GET запрос в получение всех групп
    try {
        // Отправляем GET запрос в получение всех групп
        const { data } = await apiGet<{ data?: Group[] }>("/api/groups/");

        // Возвращаем успех и данные
        return { success: true, message: "Успешно", data }
    } catch (error) {
        // Возвращаем ошибку
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function GetGroup(id: string): Promise<HandlerResult<Group>>{
    // Проверяем, является ли id группы корректным
    if (!isValidEntityId(id)) return { success: false, message: "Некорректный id группы" };
    try {
        // Отправляем GET запрос в получение группы
        const { data } = await apiGet<{ data?: Group }>(`/api/groups/${id}`);

        // Возвращаем успех и данные
        return { success: true, message: "Успешно", data }
    } catch (error) {
        // Возвращаем ошибку
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function GetUsersList(): Promise<HandlerResult<{ id: number; full_name: string }[]>> {
    // Отправляем GET запрос в получение списка пользователей
    try {
        const { data } = await apiGet<{ data?: { id: number; full_name: string }[] }>('/api/users');

        // Возвращаем успех и данные
        return { success: true, data };
    } catch (error) {
        // Возвращаем ошибку
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

export async function GetUser(id: number): Promise<HandlerResult<UserProfile>> {
    // Проверяем, является ли id пользователя корректным
    if (!isValidEntityId(id)) return { success: false, message: "Некорректный id пользователя" };
    try {
        // Отправляем GET запрос в получение пользователя
        const { data } = await apiGet<{ data?: UserProfile }>(`/api/users/${id}`);

        // Возвращаем успех и данные
        return { success: true, data };
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

// Код получения студентов     
export async function GetStudents(groupId: string): Promise<HandlerResult<Student[]>> {
    // Проверяем, является ли id группы корректным
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    try {
        // Отправляем GET запрос в получение студентов
        const { data } = await apiGet<{ data?: Student[] }>(`/api/groups/${groupId}/students`);
        // Возвращаем успех и данные

        return { success: true, data };
    } catch (error) {
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

// Код создания студентов
export async function CreateStudents(groupId: string, students: { fullName: string }[]): Promise<HandlerResult> {
    // Проверяем, является ли id группы корректным
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    // Отправляем POST запрос в создание студентов
    try {
        // Отправляем POST запрос в создание студентов
        return await apiPost(`/api/groups/${groupId}/students`, { students });
    } catch (error) {
        // Возвращаем ошибку
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

// Код обновления студента
export async function UpdateStudent(groupId: string, studentId: number, newName: string): Promise<HandlerResult> {
    // Проверяем, является ли id группы и id студента корректными
    if (!isValidEntityId(groupId) || !isValidEntityId(studentId)) return { success: false, message: "Некорректный id студента или группы" };
    try {
        // Отправляем PATCH запрос в обновление студента
        return await apiPatch(`/api/groups/${groupId}/students/${studentId}`, { full_name: newName });
    } catch (error) {
        // Возвращаем ошибку
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

// Код удаления студента
export async function DeleteStudent(groupId: string, studentId: number): Promise<HandlerResult> {
    // Проверяем, является ли id группы и id студента корректными
    if (!isValidEntityId(groupId) || !isValidEntityId(studentId)) return { success: false, message: "Некорректный id студента или группы" };
    try {
        // Отправляем DELETE запрос в удаление студента
        return await apiDelete(`/api/groups/${groupId}/students/${studentId}`);
    } catch (error) {
        // Возвращаем ошибку
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

// Код сохранения оценок
export async function SaveGrades(groupId: string, students: GradeStudent[]): Promise<HandlerResult> {
    // Проверяем, является ли id группы корректным
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    try {
        // Отправляем POST запрос в сохранение оценок
        return await apiPost(`/api/groups/${groupId}/grades`, { groupId, students });
    } catch (error) {
        // Возвращаем ошибку
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

// Код удаления посещаемости за конкретный период
export async function DeleteAttendancePeriod(groupId: string, periodMonth: number): Promise<HandlerResult> {
    // Проверяем, является ли id группы и период корректными
    if (!isValidEntityId(groupId) || !isValidMonth(periodMonth)) return { success: false, message: "Некорректный период или id группы" };
    try {
        // Отправляем DELETE запрос в удаление посещаемости за конкретный период
        return await apiDelete(`/api/groups/${groupId}/attendance`, { query: { periodMonth } });
    } catch (error) {
        // Возвращаем ошибку
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

// Код удаления оценок за конкретный период
export async function DeleteGradesPeriod(groupId: string, periodSemester: number): Promise<HandlerResult> {
    // Проверяем, является ли id группы и период корректными
    if (!isValidEntityId(groupId) || !isValidSemester(periodSemester)) return { success: false, message: "Некорректный период или id группы" };
    try {
        // Отправляем DELETE запрос в удаление оценок за конкретный период
        return await apiDelete(`/api/groups/${groupId}/grades`, { query: { periodSemester } });
    } catch (error) {
        // Возвращаем ошибку
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

// Код получения оценок
export async function GetGrades(groupId: string, periodSemester?: number): Promise<HandlerResult<GradeStudent[]>> {
    // Проверяем, является ли id группы корректным
    if (!isValidEntityId(groupId)) return { success: false, message: "Некорректный id группы" };
    if (periodSemester !== undefined && !isValidSemester(periodSemester)) return { success: false, message: "Некорректный семестр" };
    try {
        // Отправляем GET запрос в получение оценок
        return await apiGet(`/api/groups/${groupId}/grades`, { query: { periodSemester } });
    } catch (error) {
        // Возвращаем ошибку
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

// Код обновления профиля
export async function UpdateProfile(data: object): Promise<HandlerResult> {
    try {
        // Отправляем PATCH запрос в обновление профиля
        return await apiPatch('/api/users', data);
        // Возвращаем ошибку
    } catch (error) {
        // Возвращаем ошибку
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}

// Код получения статистики преподавателя
export async function GetTeacherStats(): Promise<HandlerResult<TeacherStats>> {
    try {
        // Отправляем GET запрос в получение статистики преподавателя
        const { data, message } = await apiGet<{ data?: TeacherStats; message?: string }>('/api/users/stats');
        // Возвращаем успех и данные
        return { success: true, data, message };
        // Возвращаем ошибку
    } catch (error) {
        // Возвращаем ошибку
        return toErrorResult(error, "Неизвестная ошибка сервера");
    }
}
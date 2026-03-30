import {
    GroupFormSchema, GroupFormState,
    LoginFormSchema, LoginFormState,
    RegisterFormSchema, RegisterFormState
} from "@/utils/definitions";
import { handleApiResponse } from "@/utils/functions";
import {z} from "zod";
import {AttendanceStudent, GradeStudent} from "@/utils/interfaces";

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
        const loginResponse = await fetch('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' }
        });

        // Получаем данные из ответа
        const { data } = await handleApiResponse(loginResponse);

        // Создаём сессию
        const response = await fetch('/api/v1/auth/create-session', {
            method: 'POST',
            body: JSON.stringify({ uid: data.uid, email, full_name: data.full_name }),
            headers: { 'Content-Type': 'application/json' }
        });
        await handleApiResponse(response);

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
    const registerResponse = await fetch('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, full_name, password }),
        headers: { 'Content-Type': 'application/json' }
    });

    // Получаем данные из ответа
    const { data } = await handleApiResponse(registerResponse);

    // Создаём сессию
    const response = await fetch('/api/v1/auth/create-session', {
        method: 'POST',
        body: JSON.stringify({ uid: data.uid, email, full_name }),
        headers: { 'Content-Type': 'application/json' }
    });
    await handleApiResponse(response);

    // Возвращаем успех
    return { success: true };
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
        const response = await fetch('/api/v1/groups', {
            method: 'POST',
            body: JSON.stringify({ name, fk_user }),
            headers: { 'Content-Type': 'application/json' }
        });
        await handleApiResponse(response);

        // Возвращаем успех и redirectTo
        return { success: true };
    } catch (error) {
        console.log( error )
        return { success: false, message: error instanceof Error ? error.message : 'Произошла ошибка' };
    }
}

export async function UpdateGroup(id: string, data: object) {
    try {
        const response = await fetch(`/api/v1/groups/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.log( error )
        return { success: false, message: error instanceof Error ? error.message : 'Ошибка обновления' };
    }
}

// Код удаления группы
export async function DeleteGroup(id: string) {
    try {
        const response = await fetch(`/api/v1/groups/${id}`, { method: 'DELETE' });
        return await handleApiResponse(response);
    } catch (error) {
        console.log( error )
        return { success: false, message: error instanceof Error ? error.message : 'Ошибка обновления' };
    }
}

export async function SaveAttendance(groupId: string, students: AttendanceStudent[]) {
    try {
        const response = await fetch(`/api/v1/groups/${groupId}/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId, students }),
        });
        return await handleApiResponse(response);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Неизвестная ошибка сервера";

        return { success: false, message: errorMessage };
    }
}

export async function GetAttendance(groupId: string, periodMonth?: number) {
    try {
        const url = new URL(`/api/v1/groups/${groupId}/attendance`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
        if (periodMonth !== undefined) {
            url.searchParams.append('periodMonth', String(periodMonth));
        }
        const response = await fetch(url.toString(), {
            method: 'GET',
        });
        return await handleApiResponse(response);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Неизвестная ошибка сервера";

        return { success: false, message: errorMessage };
    }
}

export async function GetAllGroups(){
    try {
        const response = await fetch("/api/v1/groups/")
        const { data } = await handleApiResponse(response);

        return { success: true, message: "Успешно", data }
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Неизвестная ошибка сервера";

        return { success: false, message: errorMessage };
    }
}

export async function GetGroup(id: string){
    try {
        const response = await fetch(`/api/v1/groups/${id}`)
        const { data } = await handleApiResponse(response);

        return { success: true, message: "Успешно", data }
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Неизвестная ошибка сервера";

        return { success: false, message: errorMessage };
    }
}

export async function GetUsersList() {
    try {
        const response = await fetch('/api/v1/users');
        const { data } = await handleApiResponse(response);

        return { success: true, data };
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Неизвестная ошибка сервера";

        return { success: false, message: errorMessage };
    }
}

export async function GetUser(id: number) {
    try {
        const response = await fetch(`/api/v1/users/${id}`);
        const { data } = await handleApiResponse(response);

        return { success: true, data };
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Неизвестная ошибка сервера";

        return { success: false, message: errorMessage };
    }
}

export async function SaveGrades(groupId: string, students: GradeStudent[]) {
    try {
        const response = await fetch(`/api/v1/groups/${groupId}/grades`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId, students }),
        });
        return await handleApiResponse(response);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Неизвестная ошибка сервера";

        return { success: false, message: errorMessage };
    }
}

export async function GetGrades(groupId: string, periodSemester?: number) {
    try {
        const url = new URL(`/api/v1/groups/${groupId}/grades`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
        if (periodSemester !== undefined) {
            url.searchParams.append('periodSemester', String(periodSemester));
        }
        const response = await fetch(url.toString(), {
            method: 'GET',
        });
        return await handleApiResponse(response);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Неизвестная ошибка сервера";

        return { success: false, message: errorMessage };
    }
}

export async function UpdateProfile(data: object) {
    try {
        const response = await fetch('/api/v1/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await handleApiResponse(response);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Неизвестная ошибка сервера";

        return { success: false, message: errorMessage };
    }
}

// Получение статистики преподавателя
export async function GetTeacherStats() {
    try {
        const response = await fetch('/api/v1/users/stats');
        return await handleApiResponse(response);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Неизвестная ошибка сервера";

        return { success: false, message: errorMessage };
    }
}
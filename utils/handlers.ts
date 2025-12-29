import {GroupFormSchema, GroupFormState, LoginFormSchema, LoginFormState} from "@/utils/definitions";
import { handleApiResponse } from "@/utils/functions";
import {z} from "zod";

// Код авторизации
export async function Login(_state: LoginFormState, formData: FormData) {
    try {
        // Проверяем полученные поля
        const parsed = LoginFormSchema.safeParse(Object.fromEntries(formData));
        if (!parsed.success) {
            return { message: "Ошибка валидации", fieldErrors: z.flattenError(parsed.error).fieldErrors }
        }

        // Получаем данные из формы
        const { email, password } = parsed.data;
        const redirectTo = formData.get("redirectTo")?.toString() || "/profile";

        // Отправляем POST запрос в авторизацию
        const loginResponse = await fetch('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' }
        });

        // Получаем данные из ответа
        const { data } = await handleApiResponse(loginResponse);

        // Создаём сессию
        await fetch('/api/v1/auth/create-session', {
            method: 'POST',
            body: JSON.stringify({ uid: data.uid, email }),
            headers: { 'Content-Type': 'application/json' }
        });

        // Возвращаем успех и redirectTo
        return { success: true, redirectTo };
    } catch (error) {
        return { message: error instanceof Error ? error.message : 'Произошла ошибка' };
    }
}

// Код авторизации
export async function Register(_state: LoginFormState, formData: FormData) {
    try {
        // Проверяем полученные поля
        const parsed = LoginFormSchema.safeParse(Object.fromEntries(formData));
        if (!parsed.success) {
            return { message: "Ошибка валидации", fieldErrors: z.flattenError(parsed.error).fieldErrors }
        }

        // Получаем данные из формы
        const { email, password } = parsed.data;
        const redirectTo = formData.get("redirectTo")?.toString() || "/profile";

        // Отправляем POST запрос в регистрацию
        const registerResponse = await fetch('/api/v1/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' }
        });

        // Получаем данные из ответа
        const { data } = await handleApiResponse(registerResponse);

        // Создаём сессию
        await fetch('/api/v1/auth/create-session', {
            method: 'POST',
            body: JSON.stringify({ uid: data.uid, email }),
            headers: { 'Content-Type': 'application/json' }
        });

        // Возвращаем успех и redirectTo
        return { success: true, redirectTo };
    } catch (error) {
        console.log( error )
        return { message: error instanceof Error ? error.message : 'Произошла ошибка' };
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
        await fetch('/api/v1/groups', {
            method: 'POST',
            body: JSON.stringify({ name, fk_user }),
            headers: { 'Content-Type': 'application/json' }
        });

        // Возвращаем успех и redirectTo
        return { success: true };
    } catch (error) {
        console.log( error )
        return { message: error instanceof Error ? error.message : 'Произошла ошибка' };
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

// Код сохранения (создания/редактирования) студента
export async function SaveStudent(studentId: string | undefined, data: object) {
    try {
        const url = studentId ? `/api/v1/students/${studentId}` : `/api/v1/students`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.log( error )
        return { success: false, message: error instanceof Error ? error.message : 'Ошибка сохранения' };
    }
}

export async function DeleteStudent(id: number) {
    try {
        const response = await fetch(`/api/v1/students/${id}`, {
            method: 'DELETE',
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.log( error )
        return { success: false, message: error instanceof Error ? error.message : 'Ошибка удаления' };
    }
}
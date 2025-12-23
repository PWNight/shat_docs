import {GroupFormSchema, GroupFormState, LoginFormSchema, LoginFormState, StudentFormSchema} from "@/utils/definitions";
import { handleApiResponse } from "@/utils/functions";
import {NextResponse} from "next/server";
import {z} from "zod";

// Код авторизации
export async function Login(state: LoginFormState, formData: FormData) {
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
export async function Register(state: LoginFormState, formData: FormData) {
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
        const loginResponse = await fetch('/api/v1/auth/register', {
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
        console.log( error )
        return { message: error instanceof Error ? error.message : 'Произошла ошибка' };
    }
}

// Код создания группы
export async function CreateGroup(state: GroupFormState, formData: FormData) {
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
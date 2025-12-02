import { LoginFormSchema, LoginFormState } from "@/utils/definitions";
import { handleApiResponse } from "@/utils/functions";

// Код авторизации
export async function Login(state: LoginFormState, formData: FormData) {
    try {
        // Проверяем полученные поля
        const validatedFields = LoginFormSchema.safeParse(Object.fromEntries(formData));
        if (!validatedFields.success) {
            return { errors: validatedFields.error.flatten().fieldErrors };
        }

        // Получаем данные из формы
        const { email, password } = validatedFields.data;
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
        const validatedFields = LoginFormSchema.safeParse(Object.fromEntries(formData));
        if (!validatedFields.success) {
            return { errors: validatedFields.error.flatten().fieldErrors };
        }

        // Получаем данные из формы
        const { email, password } = validatedFields.data;
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
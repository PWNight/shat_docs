// Общий тип для API ответов с ошибкой
import {LoginFormSchema, LoginFormState} from "@/utils/definitions";

interface ApiErrorResponse {
    message?: string;
}

// Утилита для обработки API ответов
async function handleApiResponse(response: Response) {
    if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        console.log(errorData);

        throw new Error(errorData.message
            ? `${errorData.message} (err ${response.status})`
            : `Неизвестная ошибка (err ${response.status})`);
    }
    return response.json();
}

// Утилита для авторизованных запросов
async function makeAuthorizedRequest(url: string, token: string, data: object, method = 'GET') {
    return fetch(url, {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
}

// Утилита авторизации
export async function Login(state: LoginFormState, formData: FormData) {
    try {
        // Проверяем полученные поля
        const validatedFields = LoginFormSchema.safeParse(Object.fromEntries(formData));
        if (!validatedFields.success) {
            return { errors: validatedFields.error.flatten().fieldErrors };
        }

        // Получаем данные из формы
        const { email, password } = validatedFields.data;
        const redirectTo = formData.get("redirectTo")?.toString() || "/me";

        // Отправляем POST запрос в авторизацию
        const loginResponse = await fetch('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' }
        });

        // Получаем данные из ответа
        const { data: id } = await handleApiResponse(loginResponse);

        // Создаём сессию
        await fetch('/api/v1/auth/create-session', {
            method: 'POST',
            body: JSON.stringify({ id, email }),
            headers: { 'Content-Type': 'application/json' }
        });

        // Возвращаем успех и redirectTo
        return { success: true, redirectTo };
    } catch (error) {
        return { message: error instanceof Error ? error.message : 'Произошла ошибка' };
    }
}
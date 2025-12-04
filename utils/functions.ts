import {twMerge} from "tailwind-merge";
import clsx, {ClassValue} from "clsx";
import {NextResponse} from "next/server";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Общий тип для API ответов с ошибкой
interface ApiErrorResponse {
    message?: string;
}

// Утилита для обработки API ответов
export async function handleApiResponse(response: Response) {
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
export async function makeAuthorizedRequest(url: string, token: string, data: object, method = 'GET') {
    return fetch(url, {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
}

export async function getAllGroups(){
    try {
        const response = await fetch("/api/v1/groups/",{
            method: "GET",
        })
        if (!response.ok) {
            return { success: false, message: `Ошибка ${response.status}, сервер вернул неожиданный ответ: ` + response.statusText };
        }
        const json = await response.json();

        return { success: true, message: "Успешно", data: json.data }
    } catch (error) {
        console.error("Ошибка работы API", error);
        const errorMessage =
            error instanceof Error ? error.message : "Неизвестная ошибка сервера";

        return { success: false, message: errorMessage };
    }
}
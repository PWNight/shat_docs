import {twMerge} from "tailwind-merge";
import clsx, {ClassValue} from "clsx";

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

export async function getAllGroups(){
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

export async function getGroup(id: string){
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

export async function getStudentsByGroup(groupId: string) {
    try {
        const response = await fetch(`/api/v1/groups/${groupId}/students`);
        const { data } = await handleApiResponse(response);

        return { success: true, data};
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Неизвестная ошибка сервера";

        return { success: false, message: errorMessage };
    }
}

export async function getUsersList() {
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
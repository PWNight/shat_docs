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
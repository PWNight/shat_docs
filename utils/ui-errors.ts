// Функция для проверки, является ли текст ошибкой подключения к базе данных
export function isDbOfflineText(text: string | null | undefined): boolean {
    // Получаем текст ошибки
    const msg = (text ?? "").toLowerCase();
    // Возвращаем true, если текст ошибки содержит ошибку подключения к базе данных
    return (
        msg.includes("etimedout") ||
        msg.includes("econnrefused") ||
        msg.includes("enotfound") ||
        msg.includes("ehostunreach") ||
        msg.includes("protocol_connection_lost") ||
        msg.includes("нет подключения к базе данных") ||
        (msg.includes("connect") && msg.includes("timeout")) ||
        (msg.includes("getaddrinfo") && msg.includes("enotfound")) ||
        (msg.includes("mysql") && msg.includes("connect"))
    );
}

// Функция для проверки, является ли текст ошибкой сетевого подключения
export function isNetworkOfflineText(text: string | null | undefined): boolean {
    // Получаем текст ошибки
    const msg = (text ?? "").toLowerCase();
    // Возвращаем true, если текст ошибки содержит ошибку сетевого подключения
    return (
        msg.includes("failed to fetch") ||
        msg.includes("networkerror") ||
        msg.includes("network error") ||
        msg.includes("fetch") && msg.includes("failed") ||
        msg.includes("internet") && msg.includes("нет")
    );
}

// Тип для вида ошибки
export type UiErrorKind = "db" | "network" | "generic";

// Сообщение ошибки подключения к базе данных
export const DB_OFFLINE_MESSAGE =
    "Нет подключения к базе данных. Проверьте доступность БД и повторите попытку.";

// Функция для проверки, является ли мета ошибка ошибкой подключения к базе данных
export function isDbOfflineMeta(status?: number, code?: string): boolean {
    return status === 503 || code === "DB_OFFLINE";
}

// Функция для получения вида ошибки по метаданным
export function getErrorKindByMeta(status?: number, code?: string): UiErrorKind {
    if (isDbOfflineMeta(status, code)) return "db";
    return "generic";
}

// Функция для получения сообщения ошибки подключения к базе данных для тоста
export function getDbOfflineToastMessage(): string {
    return DB_OFFLINE_MESSAGE;
}


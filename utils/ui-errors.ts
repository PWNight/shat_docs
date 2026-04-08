export function isDbOfflineText(text: string | null | undefined): boolean {
    const msg = (text ?? "").toLowerCase();
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

export function isNetworkOfflineText(text: string | null | undefined): boolean {
    const msg = (text ?? "").toLowerCase();
    return (
        msg.includes("failed to fetch") ||
        msg.includes("networkerror") ||
        msg.includes("network error") ||
        msg.includes("fetch") && msg.includes("failed") ||
        msg.includes("internet") && msg.includes("нет")
    );
}

export type UiErrorKind = "db" | "network" | "generic";

export const DB_OFFLINE_MESSAGE =
    "Нет подключения к базе данных. Проверьте доступность БД и повторите попытку.";

export function isDbOfflineMeta(status?: number, code?: string): boolean {
    return status === 503 || code === "DB_OFFLINE";
}

export function getErrorKindByMeta(status?: number, code?: string): UiErrorKind {
    if (isDbOfflineMeta(status, code)) return "db";
    return "generic";
}

export function getDbOfflineToastMessage(): string {
    return DB_OFFLINE_MESSAGE;
}


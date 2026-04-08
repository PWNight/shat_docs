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


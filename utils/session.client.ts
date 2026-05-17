import type { SessionPayload } from "./session.types";

export async function getSession(): Promise<SessionPayload | null> {
    try {
        const response = await fetch("/api/auth/session", {
            credentials: "include",
            cache: "no-store",
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.data?.session ?? null;
    } catch (error) {
        console.error("Failed to get session:", error);
        return null;
    }
}

export async function deleteSession(): Promise<void> {
    try {
        await fetch("/api/auth/logout", { method: "GET", credentials: "include" });
    } catch (error) {
        console.error('Failed to delete session:', error);
    }
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
    return getSession();
}

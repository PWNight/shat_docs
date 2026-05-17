import type { SessionPayload } from "./session.types";

export async function getSession(): Promise<SessionPayload | null> {
    try {
        const response = await fetch('/api/sessions');
        if (!response.ok) return null;
        const data = await response.json();
        return data.session || null;
    } catch (error) {
        console.error('Failed to get session:', error);
        return null;
    }
}

export async function deleteSession(): Promise<void> {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Failed to delete session:', error);
    }
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
    return getSession();
}

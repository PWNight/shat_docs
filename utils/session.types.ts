export interface SessionPayload {
    uid: number;
    email: string;
    full_name: string;
    expiresAt: number;
    sid: string;
}

export type SessionListItem = {
    sessionId: string;
    userId: number;
    email: string;
    fullName: string;
    deviceLabel: string;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: string;
    lastSeenAt: string;
    expiresAt: string;
    isCurrent: boolean;
    status: "active" | "revoked" | "expired";
};

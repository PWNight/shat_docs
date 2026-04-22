export type AdminUser = {
    id: number;
    full_name: string;
    email: string;
    canAccessAdmin: number;
    isRoot: number;
    registration_status: string;
};

export type RegistrationItem = { id: number; full_name: string; email: string; created_by: string };
export type ResetItem = {
    id: number;
    full_name: string;
    email: string;
    status: "pending" | "resolved" | "cancelled" | string;
    created_at?: string;
    resolved_at?: string | null;
};
export type GroupItem = { id: number; name: string; fk_user: number; owner_name: string | null };
export type GroupStatItem = { id: number; name: string; students_count: number; avg_grade: number | null; lessons_total: number; lessons_sick: number; late_total: number };
export type LogItem = { id: number; action: string; details: string | null; created_at: string; actor_name: string | null };

export type SessionItem = {
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

export type AppStats = {
    users_total: number;
    registrations_pending: number;
    admins_total: number;
    groups_total: number;
    students_total: number;
    password_resets_pending: number;
};

export type AdminOverview = {
    users: AdminUser[];
    pendingRegistrations: RegistrationItem[];
    passwordResetRequests: ResetItem[];
    groups: GroupItem[];
    groupStats: GroupStatItem[];
    logs: LogItem[];
    sessions: SessionItem[];
    appStats: AppStats;
};

export type TabType = "groups" | "users" | "sessions" | "logs" | "requests";

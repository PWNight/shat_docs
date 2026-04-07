import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { execute, query, queryOne } from "@/utils/mysql";
import { requireAuth, forbidden, serverError } from "@/utils/api";

type AdminUserRow = {
    id: number;
    full_name: string;
    email: string;
    isAdmin: number;
    isRoot: number;
    canAccessAdmin: number;
    registration_status: "pending" | "approved" | "rejected";
};

let rootBootstrapPromise: Promise<void> | null = null;

async function bootstrapRootAccountInternal(): Promise<void> {
    const existingRoot = await queryOne<AdminUserRow>(
        "SELECT id, full_name, email, isAdmin, isRoot, canAccessAdmin, registration_status FROM users WHERE isRoot = 1 LIMIT 1"
    );
    if (existingRoot) return;

    const rootEmail = process.env.ROOT_EMAIL || "root@shat.local";
    const rootName = process.env.ROOT_NAME || "Root Admin";
    const rootPassword = process.env.ROOT_PASSWORD || "ChangeMe123!";
    const passwordHash = await bcrypt.hash(rootPassword, 10);

    await execute(
        "INSERT INTO users (email, full_name, password_hash, isAdmin, isRoot, canAccessAdmin, registration_status, approved_at) VALUES (?, ?, ?, 1, 1, 1, 'approved', NOW())",
        [rootEmail, rootName, passwordHash]
    );
}

export async function ensureRootAccount(): Promise<void> {
    if (!rootBootstrapPromise) {
        rootBootstrapPromise = bootstrapRootAccountInternal().finally(() => {
            rootBootstrapPromise = null;
        });
    }
    await rootBootstrapPromise;
}

export async function getActorBySessionUid(uid: number): Promise<AdminUserRow | null> {
    return await queryOne<AdminUserRow>(
        "SELECT id, full_name, email, isAdmin, isRoot, canAccessAdmin, registration_status FROM users WHERE id = ? LIMIT 1",
        [uid]
    );
}

export async function writeAdminLog(actorUserId: number, action: string, details?: string): Promise<void> {
    await execute(
        "INSERT INTO admin_audit_logs (actor_user_id, action, details) VALUES (?, ?, ?)",
        [actorUserId, action, details || null]
    );
}

export async function requireAdmin(request: NextRequest): Promise<
    | { success: true; actor: AdminUserRow }
    | { success: false; response: NextResponse }
> {
    try {
        await ensureRootAccount();
        const authResult = await requireAuth(request);
        if (!authResult.success) {
            return authResult;
        }

        const actor = await getActorBySessionUid(authResult.user.uid);
        if (!actor) {
            return { success: false, response: forbidden("Пользователь не найден") };
        }
        if (actor.registration_status !== "approved") {
            return { success: false, response: forbidden("Регистрация не подтверждена") };
        }
        if (!actor.canAccessAdmin) {
            return { success: false, response: forbidden("Нет доступа к админ-панели") };
        }
        return { success: true, actor };
    } catch {
        return { success: false, response: serverError("Ошибка проверки прав администратора") };
    }
}

export async function getUsersForAdmin() {
    return await query(
        "SELECT id, full_name, email, isAdmin, isRoot, canAccessAdmin, registration_status, created_by, approved_at FROM users ORDER BY id DESC"
    );
}

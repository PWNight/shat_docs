import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { execute, query, queryOne } from "@/utils/mysql";
import { handleApiError, requireAuth, forbidden, serverError } from "@/utils/api";

// Тип для строки пользователя администратора
export interface AdminUserRow {
    id: number;
    full_name: string;
    email: string;
    isAdmin: number;
    isRoot: number;
    canAccessAdmin: number;
    registration_status: "pending" | "approved" | "rejected";
};

// Флаг для обеспечения существования root-аккаунта
let rootBootstrapPromise: Promise<void> | null = null;

// Функция для создания root-аккаунта
async function bootstrapRootAccountInternal(): Promise<void> {
    // Проверяем, существует ли root-аккаунт
    const existingRoot = await queryOne<AdminUserRow>(
        "SELECT id, full_name, email, isAdmin, isRoot, canAccessAdmin, registration_status FROM users WHERE isRoot = 1 LIMIT 1"
    );
    // Если root-аккаунт существует, выходим
    if (existingRoot) return;

    // Получаем данные для root-аккаунта
    const rootEmail = process.env.ROOT_EMAIL || "root@shat.local";
    const rootName = process.env.ROOT_NAME || "Root Admin";
    const rootPassword = process.env.ROOT_PASSWORD || "ChangeMe123!";
    const passwordHash = await bcrypt.hash(rootPassword, 10);

    // Создаем root-аккаунт
    await execute(
        "INSERT INTO users (email, full_name, password_hash, isAdmin, isRoot, canAccessAdmin, registration_status, approved_at) VALUES (?, ?, ?, 1, 1, 1, 'approved', NOW())",
        [rootEmail, rootName, passwordHash]
    );
}

// Функция для обеспечения существования root-аккаунта
export async function ensureRootAccount(): Promise<void> {
    // Если root-аккаунт не существует, создаем его
    if (!rootBootstrapPromise) {
        // Создаем root-аккаунт
        // После создания root-аккаунта, устанавливаем флаг в null
        rootBootstrapPromise = bootstrapRootAccountInternal().finally(() => {
            rootBootstrapPromise = null;
        });
    }
    // Ожидаем завершения создания root-аккаунта
    await rootBootstrapPromise;
}

// Функция для получения пользователя по его uid
export async function getActorBySessionUid(uid: number): Promise<AdminUserRow | null> {
    // Получаем пользователя по его uid из базы данных
    return await queryOne<AdminUserRow>(
        "SELECT id, full_name, email, isAdmin, isRoot, canAccessAdmin, registration_status FROM users WHERE id = ? LIMIT 1",
        [uid]
    );
}

// Функция для записи логов администратора
export async function writeAdminLog(actorUserId: number, action: string, details?: string): Promise<void> {
    // Записываем лог в базу данных
    await execute(
        "INSERT INTO admin_audit_logs (actor_user_id, action, details) VALUES (?, ?, ?)",
        [actorUserId, action, details || null]
    );
}

// Функция для проверки прав администратора
export async function requireAdmin(request: NextRequest): Promise<
    | { success: true; actor: AdminUserRow }
    | { success: false; response: NextResponse }
> {
    // Проверяем, что root-аккаунт существует
    try {
        await ensureRootAccount();
        const authResult = await requireAuth(request);
        // Если аутентификация не успешна, возвращаем ошибку
        if (!authResult.success) {
            return authResult;
        }

        // Получаем пользователя по его uid
        const actor = await getActorBySessionUid(authResult.user.uid);
        // Если пользователь не найден, возвращаем ошибку
        if (!actor) {
            return { success: false, response: forbidden("Пользователь не найден") };
        }
        // Если пользователь не подтвердил регистрацию, возвращаем ошибку
        if (actor.registration_status !== "approved") {
            return { success: false, response: forbidden("Регистрация не подтверждена") };
        }
        // Если пользователь не имеет доступа к админ-панели, возвращаем ошибку
        if (!actor.canAccessAdmin) {
            return { success: false, response: forbidden("Нет доступа к админ-панели") };
        }
        // Если все проверки прошли успешно, возвращаем пользователя
        return { success: true, actor };
    } catch (error) {
        // Если произошла ошибка, возвращаем ошибку
        const { message, code } = handleApiError(error, "Ошибка проверки прав администратора");
        return { success: false, response: serverError(message, code) };
    }
}

// Функция для получения пользователей для админ-панели
export async function getUsersForAdmin() {
    // Получаем пользователей из базы данных
    return await query(
        "SELECT id, full_name, email, isAdmin, isRoot, canAccessAdmin, registration_status, created_by, approved_at FROM users ORDER BY id DESC"
    );
}

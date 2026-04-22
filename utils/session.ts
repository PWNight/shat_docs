"use server";

import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import crypto from "crypto";
import { logger } from "@/utils/logger";
import { execute, query, queryOne } from "@/utils/mysql";

export interface SessionPayload {
    uid: number;
    email: string;
    full_name: string;
    expiresAt: number;
    sid: string;
}

type SessionUser = { uid: number; email: string; full_name: string };

type SessionRow = {
    session_id: string;
    user_id: number;
    user_agent: string | null;
    ip_address: string | null;
    device_label: string;
    created_at: string;
    last_seen_at: string;
    expires_at: string;
    revoked_at: string | null;
};

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

let cachedEncodedKey: Uint8Array | null = null;
let sessionStorageBootstrap: Promise<void> | null = null;

function getEncodedSessionKey(): Uint8Array {
    if (cachedEncodedKey) {
        return cachedEncodedKey;
    }

    const secretKey = process.env.SESSION_SECRET;
    if (!secretKey) {
        throw new Error("SESSION_SECRET is not set. Set it before using session utilities.");
    }

    cachedEncodedKey = new TextEncoder().encode(secretKey);
    return cachedEncodedKey;
}

function formatDeviceLabel(userAgent?: string | null): string {
    if (!userAgent) return "Неизвестное устройство";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS";
    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac OS")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    return "Браузер";
}

function getClientIp(request?: NextRequest): string | null {
    if (!request) return null;

    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0]?.trim() || null;
    }

    return request.headers.get("x-real-ip");
}

async function ensureSessionStorage(): Promise<void> {
    if (!sessionStorageBootstrap) {
        sessionStorageBootstrap = (async () => {
            await execute(`
                CREATE TABLE IF NOT EXISTS auth_sessions (
                    session_id VARCHAR(64) PRIMARY KEY,
                    user_id INT NOT NULL,
                    user_agent VARCHAR(1024) NULL,
                    ip_address VARCHAR(64) NULL,
                    device_label VARCHAR(128) NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL,
                    revoked_at TIMESTAMP NULL,
                    revoked_by_user_id INT NULL,
                    revoked_reason VARCHAR(255) NULL,
                    INDEX idx_auth_sessions_user_id (user_id),
                    INDEX idx_auth_sessions_active (revoked_at, expires_at),
                    CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
        })().finally(() => {
            sessionStorageBootstrap = null;
        });
    }
    await sessionStorageBootstrap;
}

export async function encryptSession(payload: JWTPayload): Promise<string> {
    const encodedKey = getEncodedSessionKey();
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(encodedKey);
}

export async function decryptSession(session: string | undefined): Promise<SessionPayload | null> {
    if (!session) return null;

    try {
        const encodedKey = getEncodedSessionKey();
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ["HS256"],
        });

        const typedPayload = payload as unknown as SessionPayload;
        if (typeof typedPayload.expiresAt === "number" && Date.now() > typedPayload.expiresAt) {
            return null;
        }

        return typedPayload;
    } catch (error) {
        if (process.env.NODE_ENV !== "production") {
            logger.warn("decryptSession failed", { error });
        }
        return null;
    }
}

export async function createSession(
    userData: SessionUser,
    request?: NextRequest
): Promise<{ token: string; sessionId: string }> {
    await ensureSessionStorage();
    const sessionId = crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const userAgent = request?.headers.get("user-agent") ?? null;
    const ipAddress = getClientIp(request);
    const deviceLabel = formatDeviceLabel(userAgent);

    const session = await encryptSession({
        uid: userData.uid,
        email: userData.email,
        full_name: userData.full_name,
        expiresAt: expiresAt.getTime(),
        sid: sessionId,
    });

    await execute(
        "INSERT INTO auth_sessions (session_id, user_id, user_agent, ip_address, device_label, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
        [sessionId, userData.uid, userAgent, ipAddress, deviceLabel, expiresAt]
    );

    (await cookies()).set({
        name: "session",
        value: session,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
    });

    return { token: session, sessionId };
}

export async function deleteSession() {
    (await cookies()).delete("session");
}

async function validateSessionToken(sessionToken: string, request?: NextRequest): Promise<SessionPayload | null> {
    await ensureSessionStorage();
    const payload = await decryptSession(sessionToken);
    if (!payload?.sid) return null;

    const sessionRow = await queryOne<SessionRow>(
        "SELECT session_id, user_id, user_agent, ip_address, device_label, created_at, last_seen_at, expires_at, revoked_at FROM auth_sessions WHERE session_id = ? LIMIT 1",
        [payload.sid]
    );
    if (!sessionRow) return null;
    if (sessionRow.revoked_at) return null;
    if (new Date(sessionRow.expires_at).getTime() <= Date.now()) return null;
    if (sessionRow.user_id !== payload.uid) return null;

    await execute("UPDATE auth_sessions SET last_seen_at = NOW() WHERE session_id = ?", [payload.sid]);

    if (request) {
        const userAgent = request.headers.get("user-agent");
        const ipAddress = getClientIp(request);
        if ((userAgent && userAgent !== sessionRow.user_agent) || (ipAddress && ipAddress !== sessionRow.ip_address)) {
            await execute(
                "UPDATE auth_sessions SET user_agent = COALESCE(?, user_agent), ip_address = COALESCE(?, ip_address), device_label = ? WHERE session_id = ?",
                [userAgent, ipAddress, formatDeviceLabel(userAgent ?? sessionRow.user_agent), payload.sid]
            );
        }
    }

    return payload;
}

export async function getSession(request?: NextRequest): Promise<SessionPayload | null> {
    const sessionCookie = (await cookies()).get("session")?.value;
    if (!sessionCookie) return null;
    return await validateSessionToken(sessionCookie, request);
}

export async function verifySessionFromToken(sessionToken: string, request?: NextRequest): Promise<SessionPayload | null> {
    return await validateSessionToken(sessionToken, request);
}

export async function revokeSessionById(
    sessionId: string,
    actorUserId: number,
    options?: { ownerUserId?: number; reason?: string }
): Promise<boolean> {
    await ensureSessionStorage();
    const ownerClause = options?.ownerUserId ? " AND user_id = ?" : "";
    const params: Array<string | number | null> = [actorUserId, options?.reason || null, sessionId];
    if (options?.ownerUserId) params.push(options.ownerUserId);

    const result = await execute(
        `UPDATE auth_sessions
         SET revoked_at = NOW(), revoked_by_user_id = ?, revoked_reason = ?
         WHERE revoked_at IS NULL AND expires_at > NOW() AND session_id = ?${ownerClause}`,
        params
    );
    return result.affectedRows > 0;
}

export async function revokeAllUserSessions(
    userId: number,
    actorUserId: number,
    options?: { exceptSessionId?: string; reason?: string }
): Promise<void> {
    await ensureSessionStorage();
    if (options?.exceptSessionId) {
        await execute(
            `UPDATE auth_sessions
             SET revoked_at = NOW(), revoked_by_user_id = ?, revoked_reason = ?
             WHERE user_id = ? AND revoked_at IS NULL AND expires_at > NOW() AND session_id <> ?`,
            [actorUserId, options.reason || null, userId, options.exceptSessionId]
        );
        return;
    }
    await execute(
        `UPDATE auth_sessions
         SET revoked_at = NOW(), revoked_by_user_id = ?, revoked_reason = ?
         WHERE user_id = ? AND revoked_at IS NULL AND expires_at > NOW()`,
        [actorUserId, options?.reason || null, userId]
    );
}

export async function listUserSessions(userId: number, currentSessionId?: string): Promise<SessionListItem[]> {
    await ensureSessionStorage();
    const rows = await query<(SessionRow & { email: string; full_name: string })>(
        `SELECT s.session_id, s.user_id, s.user_agent, s.ip_address, s.device_label, s.created_at, s.last_seen_at, s.expires_at, s.revoked_at,
                u.email, u.full_name
         FROM auth_sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.user_id = ? AND s.revoked_at IS NULL AND s.expires_at > NOW()
         ORDER BY s.last_seen_at DESC`,
        [userId]
    );
    return rows.map((row) => ({
        sessionId: row.session_id,
        userId: row.user_id,
        email: row.email,
        fullName: row.full_name,
        deviceLabel: row.device_label,
        userAgent: row.user_agent,
        ipAddress: row.ip_address,
        createdAt: row.created_at,
        lastSeenAt: row.last_seen_at,
        expiresAt: row.expires_at,
        isCurrent: row.session_id === currentSessionId,
    }));
}

export async function listAllActiveSessions(limit: number = 200): Promise<SessionListItem[]> {
    await ensureSessionStorage();
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(1000, Math.floor(limit))) : 200;
    const rows = await query<(SessionRow & { email: string; full_name: string })>(
        `SELECT s.session_id, s.user_id, s.user_agent, s.ip_address, s.device_label, s.created_at, s.last_seen_at, s.expires_at, s.revoked_at,
                u.email, u.full_name
         FROM auth_sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.revoked_at IS NULL AND s.expires_at > NOW()
         ORDER BY s.last_seen_at DESC
         LIMIT ${safeLimit}`
    );
    return rows.map((row) => ({
        sessionId: row.session_id,
        userId: row.user_id,
        email: row.email,
        fullName: row.full_name,
        deviceLabel: row.device_label,
        userAgent: row.user_agent,
        ipAddress: row.ip_address,
        createdAt: row.created_at,
        lastSeenAt: row.last_seen_at,
        expiresAt: row.expires_at,
        isCurrent: false,
    }));
}

export async function listAllSessions(limit: number = 200, offset: number = 0): Promise<SessionListItem[]> {
    await ensureSessionStorage();
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(1000, Math.floor(limit))) : 200;
    const safeOffset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;

    const rows = await query<(SessionRow & { email: string; full_name: string })>(
        `SELECT s.session_id, s.user_id, s.user_agent, s.ip_address, s.device_label, s.created_at, s.last_seen_at, s.expires_at, s.revoked_at,
                u.email, u.full_name
         FROM auth_sessions s
         JOIN users u ON u.id = s.user_id
         ORDER BY s.created_at DESC
         LIMIT ${safeLimit} OFFSET ${safeOffset}`
    );

    const now = Date.now();
    return rows.map((row) => {
        let status: SessionListItem["status"];
        if (row.revoked_at) {
            status = "revoked";
        } else if (new Date(row.expires_at).getTime() <= now) {
            status = "expired";
        } else {
            status = "active";
        }
        return {
            sessionId: row.session_id,
            userId: row.user_id,
            email: row.email,
            fullName: row.full_name,
            deviceLabel: row.device_label,
            userAgent: row.user_agent,
            ipAddress: row.ip_address,
            createdAt: row.created_at,
            lastSeenAt: row.last_seen_at,
            expiresAt: row.expires_at,
            isCurrent: false,
            status,
        };
    });
}
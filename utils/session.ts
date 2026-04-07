"use server";

import {SignJWT, jwtVerify, JWTPayload} from "jose";
import { cookies } from "next/headers";

export interface SessionPayload {
    uid: number;
    email: string;
    full_name: string;
    expiresAt: number;
}

let cachedEncodedKey: Uint8Array | null = null;

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

// Шифруем payload
export async function encryptSession(payload: JWTPayload): Promise<string> {
    const encodedKey = getEncodedSessionKey();
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(encodedKey);
}

// Расшифровываем и возвращаем типизированный объект или null
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
            console.warn("decryptSession failed:", error);
        }
        return null;
    }
}

// Создаём сессию
export async function createSession(userData: { uid: number; email: string, full_name: string }) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await encryptSession({
        uid: userData.uid,
        email: userData.email,
        full_name: userData.full_name,
        expiresAt: expiresAt.getTime(),
    });

    (await cookies()).set({
        name: "session",
        value: session,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
    });

    return session;
}

export async function deleteSession() {
    (await cookies()).delete("session");
}

// Вспомогательная функция для получения текущей сессии
export async function getSession(): Promise<SessionPayload | null> {
    const sessionCookie = (await cookies()).get("session")?.value;
    if (!sessionCookie) return null;

    return await decryptSession(sessionCookie);
}
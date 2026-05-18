import "server-only";

import bcrypt from "bcrypt";
import type { NextRequest } from "next/server";
import { execute, queryOne } from "@/utils/sqlite";
import { createSession } from "@/utils/session.server";
import { ensureRootAccount } from "@/utils/admin";
import {
    INVALID_CREDENTIALS_MESSAGE,
    REGISTRATION_PENDING_MESSAGE,
    REGISTRATION_SUCCESS_MESSAGE,
} from "@/utils/auth-messages";

type LoginUserRow = {
    id: number;
    email: string;
    full_name: string;
    password_hash: string;
    registration_status: string;
};

export async function loginUser(
    email: string,
    password: string,
    request?: NextRequest
): Promise<
    | { success: true; uid: number; email: string; full_name: string; token: string }
    | { success: false; message: string }
> {
    await ensureRootAccount();

    const user = await queryOne<LoginUserRow>(
        "SELECT id, email, full_name, password_hash, registration_status FROM users WHERE email = ? LIMIT 1",
        [email]
    );
    if (!user) {
        return { success: false, message: INVALID_CREDENTIALS_MESSAGE };
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
        return { success: false, message: INVALID_CREDENTIALS_MESSAGE };
    }

    if (user.registration_status !== "approved") {
        return { success: false, message: REGISTRATION_PENDING_MESSAGE };
    }

    const { token } = await createSession(
        {
            uid: user.id,
            email: user.email,
            full_name: user.full_name,
        },
        request
    );

    return {
        success: true,
        uid: user.id,
        email: user.email,
        full_name: user.full_name,
        token,
    };
}

export async function registerUser(
    email: string,
    full_name: string,
    password: string
): Promise<{ success: true; message: string } | { success: false; message: string }> {
    await ensureRootAccount();

    const userWithEmail = await queryOne("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (userWithEmail) {
        return {
            success: true,
            message: REGISTRATION_SUCCESS_MESSAGE,
        };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await execute(
        "INSERT INTO users (email, full_name, password_hash, registration_status, canAccessAdmin) VALUES (?, ?, ?, 'pending', 0)",
        [email, full_name, passwordHash]
    );

    return {
        success: true,
        message: REGISTRATION_SUCCESS_MESSAGE,
    };
}

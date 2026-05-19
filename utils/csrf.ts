import { cookies } from "next/headers";
import crypto from "crypto";
import { env } from "@/env";

export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";

export async function generateCsrfToken(): Promise<string> {
    const token = crypto.randomBytes(32).toString("hex");
    const cookieStore = await cookies();
    cookieStore.set(CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 // 1 hour
    });
    return token;
}

export async function getCsrfToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(CSRF_COOKIE_NAME)?.value || null;
}

export async function validateCsrfToken(request: Request): Promise<boolean> {
    const cookieToken = await getCsrfToken();
    if (!cookieToken) {
        return false;
    }

    // Check for token in header (for API requests)
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    if (headerToken) {
        return crypto.timingSafeEqual(
            Buffer.from(cookieToken, "hex"),
            Buffer.from(headerToken, "hex")
        );
    }

    try {
        const contentType = request.headers.get("content-type");
        if (contentType?.includes("application/json")) {
            const body = (await request.clone().json()) as { csrf_token?: string };
            if (body.csrf_token) {
                return crypto.timingSafeEqual(
                    Buffer.from(cookieToken, "hex"),
                    Buffer.from(body.csrf_token, "hex")
                );
            }
        }
    } catch {
        return false;
    }

    return false;
}

export function requireCsrfProtection() {
    return async (request: Request): Promise<{ valid: boolean; error?: string }> => {
        const isValid = await validateCsrfToken(request);
        if (!isValid) {
            return {
                valid: false,
                error: "Invalid CSRF token. Please refresh the page and try again."
            };
        }
        return { valid: true };
    };
}

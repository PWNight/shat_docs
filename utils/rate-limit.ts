import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/utils/sqlite";

let tableEnsured = false;

function ensureRateLimitTable(): void {
    if (tableEnsured) return;
    const db = getDb();
    db.exec(`
        CREATE TABLE IF NOT EXISTS rate_limit_entries (
            identifier TEXT NOT NULL,
            count INTEGER NOT NULL DEFAULT 1,
            reset_time INTEGER NOT NULL,
            PRIMARY KEY (identifier)
        );
    `);
    tableEnsured = true;
}

export function getClientIdentifier(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");

    const ip = forwarded?.split(",")[0]?.trim() || realIp || cfConnectingIp || "unknown";

    if (ip === "unknown") {
        const userAgent = request.headers.get("user-agent") || "unknown";
        return `unknown-${userAgent}`;
    }

    return ip;
}

export function getClientIdentifierFromHeaders(headerStore: Headers): string {
    const forwarded = headerStore.get("x-forwarded-for");
    const realIp = headerStore.get("x-real-ip");
    const cfConnectingIp = headerStore.get("cf-connecting-ip");

    const ip = forwarded?.split(",")[0]?.trim() || realIp || cfConnectingIp || "unknown";

    if (ip === "unknown") {
        const userAgent = headerStore.get("user-agent") || "unknown";
        return `unknown-${userAgent}`;
    }

    return ip;
}

export function checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
): { success: boolean; remaining: number; resetTime: number } {
    ensureRateLimitTable();
    const db = getDb();
    const now = Date.now();

    db.prepare("DELETE FROM rate_limit_entries WHERE reset_time <= ?").run(now);

    const row = db.prepare("SELECT count, reset_time FROM rate_limit_entries WHERE identifier = ?").get(identifier) as
        | { count: number; reset_time: number }
        | undefined;

    if (!row) {
        const resetTime = now + windowMs;
        db.prepare("INSERT INTO rate_limit_entries (identifier, count, reset_time) VALUES (?, 1, ?)").run(identifier, resetTime);
        return { success: true, remaining: maxRequests - 1, resetTime };
    }

    if (row.count >= maxRequests) {
        return { success: false, remaining: 0, resetTime: row.reset_time };
    }

    const newCount = row.count + 1;
    db.prepare("UPDATE rate_limit_entries SET count = ? WHERE identifier = ?").run(newCount, identifier);
    return { success: true, remaining: maxRequests - newCount, resetTime: row.reset_time };
}

export function rateLimitResponse(
    resetTime: number,
    maxRequests: number
): NextResponse {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    return NextResponse.json(
        {
            success: false,
            message: "Слишком много запросов. Попробуйте позже.",
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter
        },
        {
            status: 429,
            headers: {
                "Retry-After": retryAfter.toString(),
                "X-RateLimit-Limit": maxRequests.toString(),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": new Date(resetTime).toISOString()
            }
        }
    );
}

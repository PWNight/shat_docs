import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function getClientIdentifier(request: NextRequest): string {
    // Try to get real IP from headers
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");
    
    const ip = forwarded?.split(",")[0]?.trim() || realIp || cfConnectingIp || "unknown";
    
    // Fallback to a combination of IP and User-Agent if IP is unknown
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
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);
    
    // Clean up expired entries
    if (entry && now > entry.resetTime) {
        rateLimitStore.delete(identifier);
    }
    
    const currentEntry = rateLimitStore.get(identifier);
    
    if (!currentEntry) {
        // First request
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + windowMs
        });
        return { success: true, remaining: maxRequests - 1, resetTime: now + windowMs };
    }
    
    if (currentEntry.count >= maxRequests) {
        // Rate limit exceeded
        return { 
            success: false, 
            remaining: 0, 
            resetTime: currentEntry.resetTime 
        };
    }
    
    // Increment count
    currentEntry.count++;
    return { 
        success: true, 
        remaining: maxRequests - currentEntry.count, 
        resetTime: currentEntry.resetTime 
    };
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

// Clean up expired entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitStore.entries()) {
            if (now > entry.resetTime) {
                rateLimitStore.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}

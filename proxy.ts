import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PREFIXES = ["/profile", "/admin"];

function isProtectedPath(pathname: string): boolean {
    return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

async function hasValidSession(sessionToken: string): Promise<boolean> {
    const secret = process.env.SESSION_SECRET;
    if (!secret) return false;

    try {
        const key = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify(sessionToken, key, { algorithms: ["HS256"] });
        const expiresAt = (payload as { expiresAt?: unknown }).expiresAt;
        if (typeof expiresAt === "number" && Date.now() > expiresAt) {
            return false;
        }
        return typeof (payload as { uid?: unknown }).uid === "number";
    } catch {
        return false;
    }
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (!isProtectedPath(pathname)) {
        return NextResponse.next();
    }

    const sessionToken = request.cookies.get("session")?.value;
    if (!sessionToken || !(await hasValidSession(sessionToken))) {
        const loginUrl = new URL("/login", request.url);
        const redirectTarget = pathname.startsWith("/") ? pathname.slice(1) : pathname;
        loginUrl.searchParams.set("to", redirectTarget);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/profile/:path*", "/admin/:path*"],
};

import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/utils/csrf";
import { requireAuth } from "@/utils/api";
import { NextRequest } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/utils/rate-limit";

export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult.response;
    }

    // Rate limiting: 30 requests per minute per user
    const clientId = `user:${authResult.user.uid}`;
    const rateLimitResult = checkRateLimit(`csrf:get:${clientId}`, 30, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 30);
    }

    try {
        const token = await generateCsrfToken();
        return NextResponse.json({ success: true, csrf_token: token });
    } catch {
        return NextResponse.json(
            { success: false, message: "Failed to generate CSRF token" },
            { status: 500 }
        );
    }
}

import { NextRequest } from "next/server";
import { handleApiError, jsonResponse, requireAuth, serverError, successResponse } from "@/utils/api";
import { listUserSessions } from "@/utils/session";
import { checkRateLimit, rateLimitResponse } from "@/utils/rate-limit";

export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.response;

    // Rate limiting: 30 requests per minute per user
    const clientId = `user:${authResult.user.uid}`;
    const rateLimitResult = checkRateLimit(`sessions:get:${clientId}`, 30, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 30);
    }

    try {
        const sessions = await listUserSessions(authResult.user.uid, authResult.user.sid);
        return jsonResponse(successResponse(sessions));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

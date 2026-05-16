import { NextRequest } from "next/server";
import { handleApiError, jsonResponse, serverError, successResponse } from "@/utils/api";
import { requireAdmin } from "@/utils/admin";
import { listAllActiveSessions } from "@/utils/session";
import { checkRateLimit, rateLimitResponse } from "@/utils/rate-limit";

export async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    // Rate limiting: 30 requests per minute per admin
    const clientId = `admin:${adminCheck.actor.id}`;
    const rateLimitResult = checkRateLimit(`admin:sessions:get:${clientId}`, 30, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 30);
    }

    try {
        const sessions = await listAllActiveSessions(300);
        return jsonResponse(successResponse(sessions));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

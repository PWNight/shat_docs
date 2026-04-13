import { NextRequest } from "next/server";
import { handleApiError, jsonResponse, requireAuth, serverError, successResponse } from "@/utils/api";
import { listUserSessions } from "@/utils/session";

export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.response;

    try {
        const sessions = await listUserSessions(authResult.user.uid, authResult.user.sid);
        return jsonResponse(successResponse(sessions));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

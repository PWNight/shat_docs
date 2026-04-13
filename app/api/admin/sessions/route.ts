import { NextRequest } from "next/server";
import { handleApiError, jsonResponse, serverError, successResponse } from "@/utils/api";
import { requireAdmin } from "@/utils/admin";
import { listAllActiveSessions } from "@/utils/session";

export async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    try {
        const sessions = await listAllActiveSessions(300);
        return jsonResponse(successResponse(sessions));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

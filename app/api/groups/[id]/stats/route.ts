import { NextRequest } from "next/server";
import {
    requireAuth,
    notFound,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError,
} from "@/utils/api";
import { fetchGroupStatsById } from "@/utils/group-stats";
import { checkRateLimit, rateLimitResponse } from "@/utils/rate-limit";
import { requireGroupAccess } from "@/utils/group-access";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth(_request);
    if (!authResult.success) {
        return authResult.response;
    }

    // Rate limiting: 60 requests per minute per user
    const clientId = `user:${authResult.user.uid}`;
    const rateLimitResult = checkRateLimit(`stats:get:${clientId}`, 60, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 60);
    }

    const { id } = await params;
    const access = await requireGroupAccess(_request, id);
    if (!access.success) {
        return access.response;
    }

    const groupId = access.group.id;

    try {
        const stats = await fetchGroupStatsById(groupId);
        if (!stats) {
            return notFound(`Группа с айди ${id} не найдена`);
        }
        return jsonResponse(successResponse(stats));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

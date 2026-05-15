import { NextRequest } from "next/server";
import {
    requireAuth,
    notFound,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError,
    badRequest,
} from "@/utils/api";
import { fetchGroupStatsById } from "@/utils/group-stats";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth(_request);
    if (!authResult.success) {
        return authResult.response;
    }

    const { id } = await params;
    const groupId = Number(id);
    if (!Number.isFinite(groupId) || groupId <= 0) {
        return badRequest("Некорректный id группы");
    }

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

import { NextRequest } from "next/server";
import { queryOne } from "@/utils/sqlite";
import {
    requireAuth,
    notFound,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError,
} from "@/utils/api";
import { checkRateLimit, rateLimitResponse } from "@/utils/rate-limit";

// Получение пользователя
export async function GET(_request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth(_request);
    if (!authResult.success) {
        return authResult.response;
    }

    // Rate limiting: 60 requests per minute per user
    const clientId = `user:${authResult.user.uid}`;
    const rateLimitResult = checkRateLimit(`users:id:get:${clientId}`, 60, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 60);
    }

    try{
        const {id} = await params;
        const user = await queryOne(
            'SELECT * FROM users WHERE id = ?', [id]
        );
        if (!user) {
            return notFound(`Пользователь с айди ${id} не найден`);
        }
        return jsonResponse(successResponse(user));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}
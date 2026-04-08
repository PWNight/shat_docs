import { NextRequest } from "next/server";
import {queryOne} from "@/utils/mysql";
import {
    requireAuth,
    notFound,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError,
} from "@/utils/api";

// Получение пользователя
export async function GET(_request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth(_request);
    if (!authResult.success) {
        return authResult.response;
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
import { deleteSession } from "@/utils/session";
import { NextRequest } from "next/server";
import {
    unauthorized,
    badRequest,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError,
    extractSession,
} from "@/utils/api";

export async function GET(request: NextRequest) {
    try {
        const sessionToken = request.cookies.get("session")?.value
            ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

        if (!sessionToken) {
            return unauthorized("Не авторизован");
        }

        const userData = await extractSession(request);
        if (!userData) {
            return badRequest("Токен некорректен");
        }

        await deleteSession();
        return jsonResponse(successResponse(null, "Успешно"));
    } catch (error) {
        const { message } = handleApiError(error);
        return serverError(message);
    }
}
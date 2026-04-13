import { deleteSession, revokeSessionById } from "@/utils/session";
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

        if (userData.sid) {
            await revokeSessionById(userData.sid, userData.uid, { ownerUserId: userData.uid, reason: "logout" });
        }
        await deleteSession();
        return jsonResponse(successResponse(null, "Успешно"));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}
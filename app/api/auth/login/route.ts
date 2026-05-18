import { NextRequest } from "next/server";
import { LoginFormSchema } from "@/utils/validation";
import {
    safeParseJson,
    validateData,
    badRequest,
    unauthorized,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError,
} from "@/utils/api";
import { loginUser } from "@/utils/auth-service";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/utils/rate-limit";

export async function POST(request: NextRequest) {
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(`login:${clientId}`, 5, 15 * 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 5);
    }

    const parseResult = await safeParseJson(request);
    if (!parseResult.success) {
        return badRequest(parseResult.error);
    }

    const validation = validateData(LoginFormSchema, parseResult.data);
    if (!validation.success) {
        return badRequest("Ошибка валидации", validation.errors);
    }

    const { email, password } = validation.data;

    try {
        const result = await loginUser(email, password, request);
        if (!result.success) {
            return unauthorized(result.message);
        }

        return jsonResponse(
            successResponse({
                uid: result.uid,
                email: result.email,
                full_name: result.full_name,
                token: result.token,
            })
        );
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

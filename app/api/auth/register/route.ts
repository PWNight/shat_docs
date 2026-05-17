import { NextRequest } from "next/server";
import { RegisterFormSchema } from "@/utils/definitions";
import {
    safeParseJson,
    validateData,
    badRequest,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError,
} from "@/utils/api";
import { registerUser } from "@/utils/auth-service";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/utils/rate-limit";

export async function POST(request: NextRequest) {
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(`register:${clientId}`, 3, 60 * 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 3);
    }

    const parseResult = await safeParseJson(request);
    if (!parseResult.success) {
        return badRequest(parseResult.error);
    }

    const validation = validateData(RegisterFormSchema, parseResult.data);
    if (!validation.success) {
        return badRequest("Ошибка валидации", validation.errors);
    }

    const { email, full_name, password } = validation.data;

    try {
        const result = await registerUser(email, full_name, password);
        if (!result.success) {
            return badRequest(result.message);
        }

        return jsonResponse(successResponse(null, result.message));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

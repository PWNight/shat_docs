import { logger } from "@/utils/logger";

type ApiResponseBody = {
    success?: boolean;
    message?: string;
    code?: string;
    error?: string;
    data?: unknown;
};

export class ApiResponseError extends Error {
    status: number;
    code?: string;
    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = "ApiResponseError";
        this.status = status;
        this.code = code;
    }
}

function parseResponseBody(response: Response): Promise<ApiResponseBody | null> {
    return response
        .text()
        .then((raw) => {
            if (!raw) return null;
            try {
                return JSON.parse(raw) as ApiResponseBody;
            } catch {
                return null;
            }
        });
}

export async function handleApiResponse(response: Response): Promise<ApiResponseBody> {
    const body = await parseResponseBody(response);

    if (!response.ok) {
        const messageFromBody = body?.message ?? body?.error;
        const message = messageFromBody
            ? `${messageFromBody} (err ${response.status})`
            : `Ошибка запроса (err ${response.status})`;

        const apiCode = body?.code ?? body?.error;
        logger.warn("API request failed", { status: response.status, code: apiCode, message: messageFromBody });
        throw new ApiResponseError(message, response.status, apiCode);
    }

    if (!body) {
        return { success: true };
    }

    return body;
}

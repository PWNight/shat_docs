import { getHealthStatus } from "@/utils/health";
import { jsonResponse, successResponse } from "@/utils/api";

export async function GET() {
    const health = await getHealthStatus();
    return jsonResponse(successResponse(health), health.status === "ok" ? 200 : 503);
}

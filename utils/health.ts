import { queryOne } from "@/utils/sqlite";
import { version } from "@/package.json";

export type HealthStatus = {
    status: "ok" | "degraded";
    version: string;
    database: "connected" | "offline";
    timestamp: string;
};

export async function getHealthStatus(): Promise<HealthStatus> {
    let database: HealthStatus["database"] = "offline";

    try {
        await queryOne("SELECT 1 AS ok");
        database = "connected";
    } catch {
        database = "offline";
    }

    return {
        status: database === "connected" ? "ok" : "degraded",
        version,
        database,
        timestamp: new Date().toISOString(),
    };
}

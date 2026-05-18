import { jsonResponse, successResponse } from "@/utils/api";
import { getSession } from "@/utils/session.server";

export async function GET() {
    const session = await getSession();

    if (!session) {
        return jsonResponse(successResponse({ session: null }));
    }

    return jsonResponse(
        successResponse({
            session: {
                uid: session.uid,
                email: session.email,
                full_name: session.full_name,
                sid: session.sid,
                expiresAt: session.expiresAt,
            },
        })
    );
}

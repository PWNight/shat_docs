import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/utils/csrf";
import { requireAuth } from "@/utils/api";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult.response;
    }

    try {
        const token = await generateCsrfToken();
        return NextResponse.json({ success: true, csrf_token: token });
    } catch {
        return NextResponse.json(
            { success: false, message: "Failed to generate CSRF token" },
            { status: 500 }
        );
    }
}

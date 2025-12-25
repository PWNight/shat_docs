import { NextRequest, NextResponse } from "next/server";
import { query } from "@/utils/mysql";
import { getSession } from "@/utils/session";

export async function GET(request: NextRequest) {
    try {
        const userData = await getSession();
        if (!userData) {
            return NextResponse.json({ success: false, message: "Необходима авторизация" }, { status: 401 });
        }

        const users = await query('SELECT id, email FROM users');

        return NextResponse.json({ success: true, data: users }, { status: 200 });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ success: false, message: "Ошибка сервера" }, { status: 500 });
    }
}
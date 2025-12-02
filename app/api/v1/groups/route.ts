import {query} from "@/utils/mysql";
import {NextRequest, NextResponse} from "next/server";

export async function GET(request: NextRequest) {
    try{
        const [groups]: any = await query("SELECT * FROM groups");
        return NextResponse.json({ success: true, data: groups }, {status:200})
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: 'Серверная ошибка',
            error: {
                message: error.message,
                code: error.code || 'UNKNOWN_ERROR'
            }
        }, {status:500})
    }
}
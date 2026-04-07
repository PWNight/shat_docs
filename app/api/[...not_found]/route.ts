import { NextResponse } from "next/server";
export async function GET() {
    return NextResponse.json({
        success: false,
        message: "Ресурс не найден",
        code: "NOT_FOUND"
    }, { status: 404 });
}
export async function POST() {
    return NextResponse.json({
        success: false,
        message: "Ресурс не найден",
        code: "NOT_FOUND"
    }, { status: 404 });
}
export async function PATCH() {
    return NextResponse.json({
        success: false,
        message: "Ресурс не найден",
        code: "NOT_FOUND"
    }, { status: 404 });
}
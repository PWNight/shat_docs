import { NextRequest } from "next/server";
import {query, execute} from "@/utils/mysql";
import {
    requireAuth,
    safeParseJson,
    badRequest,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError,
} from "@/utils/api";


// Получение списка студентов
export async function GET(_request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth(_request);
    if (!authResult.success) {
        return authResult.response;
    }

    try{
        const {id} = await params;
        const students = await query(
            'SELECT * FROM students WHERE fk_group = ?', [id]
        );
        return jsonResponse(successResponse(students));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

// Создание нового студента
export async function POST(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult.response;
    }

    const parseResult = await safeParseJson<{ students?: Array<{ fullName: string }> }>(request);
    if (!parseResult.success) {
        return badRequest(parseResult.error);
    }

    const students = parseResult.data.students;
    if (!Array.isArray(students)) {
        return badRequest("Неверный формат данных");
    }

    try {
        const {id} = await params;

        for (const student of students) {
            await execute(
                'INSERT INTO students (full_name, fk_group) VALUES (?, ?) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)',
                [student.fullName, id]
            );
        }

        return jsonResponse(successResponse(null, "Студенты добавлены"), 201);
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}
import { NextRequest } from "next/server";
import { queryOne, execute } from '@/utils/mysql';
import { Student } from '@/utils/interfaces';
import { RowDataPacket } from 'mysql2';
import {
    requireAuth,
    badRequest,
    notFound,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError,
} from "@/utils/api";

type StudentRow = Student & RowDataPacket;

// Обновление информации о студенте
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; studentId: string }> }
) {
    const authResult = await requireAuth(req);
    if (!authResult.success) {
        return authResult.response;
    }

    try {
        const { full_name: newName } = await req.json();
        const { id, studentId } = await params;
        const groupId = id;

        if (!newName) {
            return badRequest("Новое ФИО не указано");
        }

        // 1. Получаем текущие данные студента, чтобы знать старое имя
        const oldStudent = await queryOne<StudentRow>(
            'SELECT full_name FROM students WHERE id = ? AND fk_group = ?',
            [studentId, groupId]
        );

        if (!oldStudent) {
            return notFound("Студент не найден в этой группе");
        }

        const oldName = oldStudent.full_name;

        // 2. Обновляем имя в основной таблице студентов
        await execute(
            'UPDATE students SET full_name = ? WHERE id = ? AND fk_group = ?',
            [newName, studentId, groupId]
        );

        // 3. Синхронизируем имя в таблице посещаемости
        await execute(
            'UPDATE attendance SET full_name = ? WHERE fk_group = ? AND full_name = ?',
            [newName, groupId, oldName]
        );

        // 4. Синхронизируем имя в таблице успеваемости (оценки)
        await execute(
            'UPDATE grades SET full_name = ? WHERE fk_group = ? AND full_name = ?',
            [newName, groupId, oldName]
        );

        return jsonResponse(successResponse(null, "Данные студента и связанные записи обновлены"));

    } catch (error) {
        const { message, code } = handleApiError(error, "Ошибка при обновлении данных студента");
        return serverError(message, code);
    }
}

// Удаление студента и всех связанных данных
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; studentId: string }> }
) {
    const authResult = await requireAuth(req);
    if (!authResult.success) {
        return authResult.response;
    }

    try {
        const { id, studentId } = await params;
        const groupId = id;

        // 1. Сначала узнаем ФИО студента перед удалением
        const student = await queryOne<StudentRow>(
            'SELECT full_name FROM students WHERE id = ? AND fk_group = ?',
            [studentId, groupId]
        );

        if (!student) {
            return notFound("Студент не найден");
        }

        const studentName = student.full_name;

        // 2. Удаляем из таблицы студентов
        await execute('DELETE FROM students WHERE id = ? AND fk_group = ?', [studentId, groupId]);

        // 3. Удаляем всю посещаемость этого студента в этой группе
        await execute(
            'DELETE FROM attendance WHERE fk_group = ? AND full_name = ?',
            [groupId, studentName]
        );

        // 4. Удаляем всю успеваемость этого студента в этой группе
        await execute(
            'DELETE FROM grades WHERE fk_group = ? AND full_name = ?',
            [groupId, studentName]
        );

        return jsonResponse(successResponse(null, "Студент и все связанные данные успешно удалены"));

    } catch (error) {
        const { message, code } = handleApiError(error, "Ошибка при удалении студента");
        return serverError(message, code);
    }
}
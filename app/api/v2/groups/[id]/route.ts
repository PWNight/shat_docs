import { NextRequest } from "next/server";
import { execute, queryOne } from "@/utils/mysql";
import { GroupFormSchema } from "@/utils/definitions";
import {
    requireAuth,
    safeParseJson,
    validateData,
    badRequest,
    notFound,
    forbidden,
    serverError,
    jsonResponse,
    successResponse,
    handleApiError
} from "@/utils/api";

// Получение группы
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Проверяем авторизацию
    const authResult = await requireAuth(_request);
    if (!authResult.success) {
        return authResult.response;
    }

    const { id } = await params;

    try {
        const group = await queryOne(
            'SELECT `groups`.id, name, `groups`.created_by, fk_user, users.full_name AS leader FROM `groups` JOIN users ON fk_user = users.id WHERE `groups`.id = ?',
            [id]
        );
        if (!group) {
            return notFound(`Группа с айди ${id} не найдена`);
        }
        return jsonResponse(successResponse(group));
    } catch (error) {
        const { message } = handleApiError(error);
        return serverError(message);
    }
}

// Обновление информации о группе
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Проверяем авторизацию
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult.response;
    }

    const { id } = await params;
    const { user } = authResult;

    // Безопасно парсим JSON
    const parseResult = await safeParseJson(request);
    if (!parseResult.success) {
        return badRequest(parseResult.error);
    }

    // Валидируем данные
    const validation = validateData(GroupFormSchema, parseResult.data);
    if (!validation.success) {
        return badRequest("Ошибка валидации", validation.errors);
    }

    try {
        const group = await queryOne('SELECT * FROM `groups` WHERE id = ?', [id]);
        if (!group) {
            return notFound(`Группа с айди ${id} не найдена`);
        }

        if (user.uid !== group.fk_user) {
            return forbidden(`Вы не можете обновить эту группу`);
        }

        const updates: string[] = [];
        const values: unknown[] = [];

        Object.entries(validation.data).forEach(([key, value]) => {
            updates.push(`${key} = ?`);
            values.push(value);
        });

        if (updates.length === 0) {
            return badRequest("Данные из формы совпадают с данными в базе");
        }

        values.push(id);
        const sql = `UPDATE \`groups\` SET ${updates.join(', ')} WHERE id = ?`;
        await execute(sql, values);

        return jsonResponse(successResponse(null, "Группа успешно обновлена"));
    } catch (error) {
        const { message } = handleApiError(error);
        return serverError(message);
    }
}

// Удаление группы
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Проверяем авторизацию
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult.response;
    }

    const { id } = await params;
    const { user } = authResult;

    try {
        const group = await queryOne('SELECT * FROM `groups` WHERE id = ? LIMIT 1', [id]);
        if (!group) {
            return notFound(`Группа с айди ${id} не найдена`);
        }

        if (user.uid !== group.fk_user) {
            return forbidden(`Вы не можете удалить эту группу`);
        }

        await execute("DELETE FROM `groups` WHERE id = ?", [id]);
        return jsonResponse(successResponse(null, `Группа с айди ${id} успешно удалена`));
    } catch (error) {
        const { message } = handleApiError(error);
        return serverError(message);
    }
}
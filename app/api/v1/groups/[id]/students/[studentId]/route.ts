import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/utils/mysql';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; studentId: string }> }
) {
    try {
        const { full_name: newName } = await req.json();
        const { id, studentId } = await params;
        const groupId = id;

        if (!newName) {
            return NextResponse.json({ error: 'Новое ФИО не указано' }, { status: 400 });
        }

        // 1. Получаем текущие данные студента, чтобы знать старое имя
        const oldStudent = await queryOne<{ full_name: string }>(
            'SELECT full_name FROM students WHERE id = ? AND fk_group = ?',
            [studentId, groupId]
        );

        if (!oldStudent) {
            return NextResponse.json({ error: 'Студент не найден в этой группе' }, { status: 404 });
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

        return NextResponse.json({
            success: true,
            message: 'Данные студента и связанные записи обновлены'
        });

    } catch (error) {
        console.error('[STUDENT_PATCH_ERROR]', error);
        return NextResponse.json({ error: 'Ошибка при обновлении данных студента' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; studentId: string }> }
) {
    try {
        const { id, studentId } = await params;
        const groupId = id;

        // 1. Сначала узнаем ФИО студента перед удалением
        const student = await queryOne<{ full_name: string }>(
            'SELECT full_name FROM students WHERE id = ? AND fk_group = ?',
            [studentId, groupId]
        );

        if (!student) {
            return NextResponse.json({ error: 'Студент не найден' }, { status: 404 });
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

        return NextResponse.json({
            success: true,
            message: 'Студент и все связанные данные успешно удалены'
        });

    } catch (error) {
        console.error('[STUDENT_DELETE_ERROR]', error);
        return NextResponse.json({ error: 'Ошибка при удалении студента' }, { status: 500 });
    }
}
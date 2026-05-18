import type { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/utils/sqlite";
import { forbidden, notFound, requireAuth } from "@/utils/api";
import { getActorBySessionUid } from "@/utils/admin";

type GroupRow = {
    id: number;
    fk_user: number;
    name: string;
};

export async function getGroupById(groupId: number | string): Promise<GroupRow | null> {
    const id = Number(groupId);
    if (!Number.isFinite(id) || id <= 0) return null;
    return queryOne<GroupRow>('SELECT id, fk_user, name FROM "groups" WHERE id = ? LIMIT 1', [id]);
}

export async function canAccessGroup(
    userId: number,
    group: GroupRow,
    options?: { allowAdmin?: boolean }
): Promise<boolean> {
    if (group.fk_user === userId) return true;
    if (options?.allowAdmin === false) return false;

    const actor = await getActorBySessionUid(userId);
    return Boolean(actor?.canAccessAdmin);
}

export async function requireGroupAccess(
    request: NextRequest,
    groupId: number | string,
    options?: { allowAdmin?: boolean }
): Promise<
    | { success: true; user: NonNullable<Awaited<ReturnType<typeof import("@/utils/session.server").getSession>>>; group: GroupRow }
    | { success: false; response: NextResponse }
> {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
        return authResult;
    }

    const group = await getGroupById(groupId);
    if (!group) {
        return { success: false, response: notFound("Группа не найдена") };
    }

    const allowed = await canAccessGroup(authResult.user.uid, group, options);
    if (!allowed) {
        return { success: false, response: forbidden("Нет доступа к этой группе") };
    }

    return { success: true, user: authResult.user, group };
}

export async function teacherHasGroup(userId: number): Promise<boolean> {
    const row = await queryOne<{ id: number }>(
        'SELECT id FROM "groups" WHERE fk_user = ? LIMIT 1',
        [userId]
    );
    return Boolean(row);
}

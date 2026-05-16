import { NextRequest } from "next/server";
import { query } from "@/utils/sqlite";
import { fetchAllGroupStats } from "@/utils/group-stats";
import { jsonResponse, serverError, successResponse, handleApiError } from "@/utils/api";
import { getUsersForAdmin, requireAdmin } from "@/utils/admin";
import { listAllSessions, getSession, type SessionListItem } from "@/utils/session";
import { checkRateLimit, rateLimitResponse } from "@/utils/rate-limit";

export async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) return adminCheck.response;

    // Rate limiting: 30 requests per minute per admin
    const clientId = `admin:${adminCheck.actor.id}`;
    const rateLimitResult = checkRateLimit(`admin:overview:get:${clientId}`, 30, 60 * 1000);
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult.resetTime, 30);
    }

    try {
        const users = await getUsersForAdmin();
        const pendingRegistrations = await query(
            "SELECT id, email, full_name, created_by FROM users WHERE registration_status = 'pending' ORDER BY id ASC"
        );
        const passwordResetRequests = await query(
            "SELECT pr.id, pr.user_id, pr.status, pr.created_at, pr.resolved_at, u.full_name, u.email FROM password_reset_requests pr JOIN users u ON u.id = pr.user_id ORDER BY pr.id DESC LIMIT 100"
        );
        const groups = await query(
            "SELECT g.id, g.name, g.created_by, g.fk_user, u.full_name as owner_name FROM \"groups\" g LEFT JOIN users u ON u.id = g.fk_user ORDER BY g.id DESC"
        );
        const groupStats = await fetchAllGroupStats();
        const logs = await query(
            "SELECT l.id, l.action, l.details, l.created_at, u.full_name as actor_name FROM admin_audit_logs l LEFT JOIN users u ON u.id = l.actor_user_id ORDER BY l.id DESC LIMIT 200"
        );

        const currentSession = await getSession(request);
        let sessions: SessionListItem[] = await listAllSessions(500); // Fetch all sessions with a higher limit
        sessions = sessions.map(s => ({
            ...s,
            isCurrent: s.sessionId === currentSession?.sid,
        }));

        const appStatsRows = await query(
            "SELECT (SELECT COUNT(*) FROM users) AS users_total, (SELECT COUNT(*) FROM users WHERE registration_status = 'pending') AS registrations_pending, (SELECT COUNT(*) FROM users WHERE canAccessAdmin = 1) AS admins_total, (SELECT COUNT(*) FROM \"groups\") AS groups_total, (SELECT COUNT(*) FROM students) AS students_total, (SELECT COUNT(*) FROM password_reset_requests WHERE status = 'pending') AS password_resets_pending"
        );
        const appStats = Array.isArray(appStatsRows) && appStatsRows.length > 0 ? appStatsRows[0] : null;

        return jsonResponse(successResponse({ users, pendingRegistrations, passwordResetRequests, groups, groupStats, logs, sessions, appStats }));
    } catch (error) {
        const { message, code } = handleApiError(error);
        return serverError(message, code);
    }
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock3, KeyRound, Layers, Shield, UserCog, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import NotifyAlert from "@/components/NotifyAlert";
import PageErrorState from "@/components/ui/PageErrorState";
import Loader from "@/components/ui/animations/Loader";
import { getSession } from "@/utils/session";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/utils/http-client";
import { ApiResponseError } from "@/utils/functions";
import { getDbOfflineToastMessage, getErrorKindByMeta, isDbOfflineMeta } from "@/utils/ui-errors";
import { StatCard, TabButton } from "@/components/admin/AdminUi";
import GroupsTab from "@/components/admin/GroupsTab";
import UsersTab from "@/components/admin/UsersTab";
import RequestsTab from "@/components/admin/RequestsTab";
import SessionsTab from "@/components/admin/SessionsTab";
import LogsTab from "@/components/admin/LogsTab";
import AdminDialogs from "@/components/admin/AdminDialogs";
import type { AdminOverview, AdminUser, GroupItem, TabType } from "@/app/admin/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeWhitespace = (value: string) => value.trim().replace(/\s+/g, " ");

const isStrongPassword = (value: string) => {
    const normalized = value.trim();
    return normalized.length >= 8
        && normalized.length <= 72
        && /[A-Za-zА-Яа-я]/.test(normalized)
        && /\d/.test(normalized);
};

export default function AdminPage() {
    const [data, setData] = useState<AdminOverview | null>(null);
    const [userData, setUserData] = useState<{ email: string; uid: number }>({ email: "", uid: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message: string; status?: number; code?: string } | null>(null);
    const [notify, setNotify] = useState<{ message: string; type: string }>({ message: "", type: "" });
    const [tab, setTab] = useState<TabType>("groups");
    const [newPasswords, setNewPasswords] = useState<Record<number, string>>({});
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupTeacherId, setNewGroupTeacherId] = useState("");
    const [groupDrafts, setGroupDrafts] = useState<Record<number, { name: string; fk_user: string }>>({});
    const [userDrafts, setUserDrafts] = useState<Record<number, { full_name: string; email: string }>>({});
    const [busy, setBusy] = useState(false);
    const [actionKey, setActionKey] = useState<string | null>(null);
    const [groupEditId, setGroupEditId] = useState<number | null>(null);
    const [groupDeleteId, setGroupDeleteId] = useState<number | null>(null);
    const [userEditId, setUserEditId] = useState<number | null>(null);
    const [userDeleteId, setUserDeleteId] = useState<number | null>(null);
    const [userResetId, setUserResetId] = useState<number | null>(null);
    const [resetRequestDialogId, setResetRequestDialogId] = useState<number | null>(null);
    const [resetPasswordDraft, setResetPasswordDraft] = useState("");
    const router = useRouter();

    const load = useCallback(async (silent: boolean = false) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const session = await getSession();
            if (!session) {
                router.push("/login?to=admin");
                return;
            }
            setUserData({ email: session.email, uid: session.uid });
            const response = await apiGet<{ data: AdminOverview }>("/api/admin/overview");
            setData(response.data);
        } catch (e) {
            const fallbackMessage = e instanceof Error ? e.message : "Ошибка загрузки админ панели";
            if (e instanceof ApiResponseError) setError({ message: fallbackMessage, status: e.status, code: e.code });
            else setError({ message: fallbackMessage });
            setNotify({ message: fallbackMessage, type: "error" });
        } finally {
            if (!silent) setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        void load();
    }, [load]);

    const runAction = async (action: () => Promise<void>, key: string, successMessage?: string, reloadAfter: boolean = true) => {
        if (busy) return;
        setBusy(true);
        setActionKey(key);
        try {
            await action();
            if (successMessage) setNotify({ message: successMessage, type: "success" });
            if (reloadAfter) await load(true);
        } catch (e) {
            if (e instanceof ApiResponseError) {
                const dbOffline = isDbOfflineMeta(e.status, e.code);
                setNotify({ message: dbOffline ? getDbOfflineToastMessage() : e.message, type: dbOffline ? "warning" : "error" });
                return;
            }
            const message = e instanceof Error ? e.message : "Ошибка выполнения операции";
            setNotify({ message, type: "error" });
        } finally {
            setBusy(false);
            setActionKey(null);
        }
    };

    const approve = async (userId: number) => runAction(async () => {
        await apiPatch(`/api/admin/registrations/${userId}`, { status: "approved" });
    }, `approve-${userId}`, "Заявка подтверждена");

    const reject = async (userId: number) => runAction(async () => {
        await apiPatch(`/api/admin/registrations/${userId}`, { status: "rejected" });
    }, `reject-${userId}`, "Заявка отклонена");

    const toggleAccess = async (userId: number) => runAction(async () => {
        const response = await apiPatch<{ data?: { userId: number; canAccessAdmin: number } }>(`/api/admin/users/${userId}`, { action: "toggle_access" });
        const next = response.data;
        if (!next) return;
        setData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                users: prev.users.map((u) => (u.id === next.userId ? { ...u, canAccessAdmin: next.canAccessAdmin } : u)),
                appStats: {
                    ...prev.appStats,
                    admins_total: prev.users.reduce((acc, u) => (u.id === next.userId ? acc + (next.canAccessAdmin ? 1 : 0) : acc + (u.canAccessAdmin ? 1 : 0)), 0),
                },
            };
        });
    }, `toggle-${userId}`, "Права доступа обновлены", false);

    const resolveReset = async (requestId: number) => {
        const nextPassword = (newPasswords[requestId] || "").trim();
        if (!isStrongPassword(nextPassword)) {
            setNotify({ message: "Пароль должен быть 8-72 символа и содержать буквы и цифры", type: "warning" });
            return;
        }
        await runAction(async () => {
            await apiPatch(`/api/admin/password-resets/${requestId}`, { status: "resolved", newPassword: nextPassword });
            setNewPasswords((prev) => ({ ...prev, [requestId]: "" }));
            setResetRequestDialogId(null);
        }, `reset-${requestId}`, "Пароль по заявке обновлен");
    };

    const cancelReset = async (requestId: number) => {
        await runAction(async () => {
            await apiPatch(`/api/admin/password-resets/${requestId}`, { status: "cancelled" });
            setResetRequestDialogId(null);
            setNewPasswords((prev) => ({ ...prev, [requestId]: "" }));
        }, `cancel-reset-${requestId}`, "Заявка на сброс отменена");
    };

    const createGroup = async () => {
        const fkUser = Number(newGroupTeacherId);
        const normalizedName = normalizeWhitespace(newGroupName);
        if (!normalizedName || normalizedName.length < 2 || normalizedName.length > 80 || !Number.isFinite(fkUser) || fkUser <= 0) {
            setNotify({ message: "Название группы: 2-80 символов, и выберите корректного преподавателя", type: "warning" });
            return;
        }
        await runAction(async () => {
            await apiPost("/api/admin/groups", { name: normalizedName, fk_user: fkUser });
            setNewGroupName("");
            setNewGroupTeacherId("");
        }, "create-group", "Группа создана");
    };

    const saveGroup = async (groupId: number) => {
        const draft = groupDrafts[groupId];
        if (!draft) return;
        const payload: { name?: string; fk_user?: number } = {};
        if (draft.name.trim()) {
            const normalizedName = normalizeWhitespace(draft.name);
            if (normalizedName.length < 2 || normalizedName.length > 80) {
                setNotify({ message: "Название группы должно быть от 2 до 80 символов", type: "warning" });
                return;
            }
            payload.name = normalizedName;
        }
        if (draft.fk_user.trim()) {
            const fkUser = Number(draft.fk_user.trim());
            if (!Number.isFinite(fkUser) || fkUser <= 0) {
                setNotify({ message: "Укажите корректного преподавателя", type: "warning" });
                return;
            }
            payload.fk_user = fkUser;
        }
        await runAction(async () => {
            await apiPatch(`/api/admin/groups/${groupId}`, payload);
            setGroupEditId(null);
        }, `save-group-${groupId}`, "Группа обновлена");
    };

    const deleteGroup = async (groupId: number) => runAction(async () => {
        await apiDelete(`/api/admin/groups/${groupId}`);
        setGroupDeleteId(null);
    }, `delete-group-${groupId}`, "Группа удалена");

    const saveUser = async (userId: number) => {
        const draft = userDrafts[userId];
        if (!draft) return;
        const normalizedName = normalizeWhitespace(draft.full_name);
        const normalizedEmail = draft.email.trim().toLowerCase();
        if (normalizedName.length < 2 || normalizedName.length > 120) {
            setNotify({ message: "ФИО должно быть от 2 до 120 символов", type: "warning" });
            return;
        }
        if (!EMAIL_RE.test(normalizedEmail) || normalizedEmail.length > 254) {
            setNotify({ message: "Укажите корректный email", type: "warning" });
            return;
        }
        await runAction(async () => {
            await apiPatch(`/api/admin/users/${userId}`, { full_name: normalizedName, email: normalizedEmail });
            setUserEditId(null);
        }, `save-user-${userId}`, "Пользователь обновлен");
    };

    const deleteUser = async (userId: number) => runAction(async () => {
        await apiDelete(`/api/admin/users/${userId}`);
        setUserDeleteId(null);
    }, `delete-user-${userId}`, "Пользователь удален");

    const resetUserPasswordDirect = async (userId: number) => {
        const newPassword = resetPasswordDraft.trim();
        if (!isStrongPassword(newPassword)) {
            setNotify({ message: "Пароль должен быть 8-72 символа и содержать буквы и цифры", type: "warning" });
            return;
        }
        await runAction(async () => {
            await apiPatch(`/api/admin/users/${userId}`, { action: "reset_password", newPassword });
            setUserResetId(null);
            setResetPasswordDraft("");
        }, `direct-reset-${userId}`, "Пароль пользователя обновлен");
    };

    const revokeAdminSession = async (sessionId: string) => runAction(async () => {
        await apiDelete(`/api/admin/sessions/${sessionId}`);
    }, `revoke-session-${sessionId}`, "Сессия отозвана");

    const startGroupEdit = (group: GroupItem) => {
        setGroupDrafts((prev) => ({ ...prev, [group.id]: { name: group.name, fk_user: String(group.fk_user) } }));
        setGroupEditId(group.id);
    };

    const startUserEdit = (user: AdminUser) => {
        setUserDrafts((prev) => ({ ...prev, [user.id]: { full_name: user.full_name, email: user.email } }));
        setUserEditId(user.id);
    };

    const startUserReset = (userId: number) => {
        setResetPasswordDraft("");
        setUserResetId(userId);
    };

    if (loading) return <Loader />;
    if (error) {
        const kind = getErrorKindByMeta(error.status, error.code);
        return (
            <PageErrorState
                kind={kind}
                title={kind === "db" ? "Нет подключения к базе данных" : "Не удалось загрузить админ-панель"}
                description={kind === "db" ? "Проверьте доступность БД и повторите попытку." : "Не удалось загрузить данные. Повторите попытку позже."}
                details={error.message}
                onAction={() => void load()}
            />
        );
    }
    if (!data) return null;

    return (
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-500 bg-background min-h-screen">
            {notify.message ? <NotifyAlert message={notify.message} type={notify.type} onClose={() => setNotify({ message: "", type: "" })} /> : null}
            <header className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-blue-500/5 to-transparent" />
                <div className="relative p-6 sm:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        <div className="space-y-2 min-w-0">
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                                Панель администратора
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium">
                                Управление доступами, группами и операционными процессами
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-800/70 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300">
                                <Users className="h-4 w-4" />
                                {userData.email}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard icon={<Users />} label="Пользователей" value={data.appStats.users_total} />
                <StatCard icon={<Shield />} label="Админов" value={data.appStats.admins_total} />
                <StatCard icon={<Layers />} label="Групп" value={data.appStats.groups_total} />
                <StatCard icon={<UserCog />} label="Студентов" value={data.appStats.students_total} />
                <StatCard icon={<Clock3 />} label="Регистраций в очереди" value={data.appStats.registrations_pending} />
                <StatCard icon={<KeyRound />} label="Сбросов паролей в очереди" value={data.appStats.password_resets_pending} />
            </div>

            <div className="grid gap-6">
                <nav className="w-full">
                    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm">
                        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-blue-500/5 to-transparent" />
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                            <TabButton active={tab === "groups"} label="Группы" icon={<Layers />} onClick={() => setTab("groups")} />
                            <TabButton active={tab === "users"} label="Пользователи" icon={<Users />} onClick={() => setTab("users")} />
                            <TabButton active={tab === "requests"} label="Заявки" icon={<KeyRound />} onClick={() => setTab("requests")} />
                            <TabButton active={tab === "sessions"} label="Сессии" icon={<Shield />} onClick={() => setTab("sessions")} />
                            <TabButton active={tab === "logs"} label="Логи" icon={<Clock3 />} onClick={() => setTab("logs")} />
                        </div>
                    </div>
                </nav>

                <section className="group relative rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm overflow-hidden min-h-[560px] transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-blue-500/5 to-transparent" />
                    <AnimatePresence mode="wait">
                        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: "easeInOut" }}>
                            {tab === "groups" ? (
                                <GroupsTab
                                    data={data}
                                    userId={userData.uid}
                                    newGroupName={newGroupName}
                                    newGroupTeacherId={newGroupTeacherId}
                                    busy={busy}
                                    actionKey={actionKey}
                                    onNewGroupNameChange={setNewGroupName}
                                    onNewGroupTeacherChange={setNewGroupTeacherId}
                                    onCreateGroup={createGroup}
                                    onStartEditGroup={startGroupEdit}
                                    onRequestDeleteGroup={setGroupDeleteId}
                                />
                            ) : null}
                            {tab === "users" ? (
                                <UsersTab
                                    data={data}
                                    busy={busy}
                                    actionKey={actionKey}
                                    onStartEditUser={startUserEdit}
                                    onRequestDeleteUser={setUserDeleteId}
                                    onRequestResetUser={startUserReset}
                                    onToggleAccess={toggleAccess}
                                />
                            ) : null}
                            {tab === "requests" ? (
                                <RequestsTab
                                    data={data}
                                    busy={busy}
                                    actionKey={actionKey}
                                    onApprove={approve}
                                    onReject={reject}
                                    onOpenResetDialog={setResetRequestDialogId}
                                    onCancelReset={cancelReset}
                                />
                            ) : null}
                            {tab === "sessions" ? (
                                <SessionsTab data={data} busy={busy} actionKey={actionKey} onRevokeSession={revokeAdminSession} />
                            ) : null}
                            {tab === "logs" ? <LogsTab data={data} /> : null}
                        </motion.div>
                    </AnimatePresence>
                </section>
            </div>

            <AdminDialogs
                data={data}
                groupEditId={groupEditId}
                setGroupEditId={setGroupEditId}
                groupDrafts={groupDrafts}
                setGroupDrafts={setGroupDrafts}
                saveGroup={saveGroup}
                groupDeleteId={groupDeleteId}
                setGroupDeleteId={setGroupDeleteId}
                deleteGroup={deleteGroup}
                userEditId={userEditId}
                setUserEditId={setUserEditId}
                userDrafts={userDrafts}
                setUserDrafts={setUserDrafts}
                saveUser={saveUser}
                userResetId={userResetId}
                setUserResetId={setUserResetId}
                resetPasswordDraft={resetPasswordDraft}
                setResetPasswordDraft={setResetPasswordDraft}
                resetUserPasswordDirect={resetUserPasswordDirect}
                userDeleteId={userDeleteId}
                setUserDeleteId={setUserDeleteId}
                deleteUser={deleteUser}
                resetRequestDialogId={resetRequestDialogId}
                setResetRequestDialogId={setResetRequestDialogId}
                newPasswords={newPasswords}
                setNewPasswords={setNewPasswords}
                resolveReset={resolveReset}
                actionKey={actionKey}
                busy={busy}
            />
        </div>
    );
}

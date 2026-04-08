"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/utils/http-client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock3, Shield, Users, UserCog, Layers, KeyRound, Trash2, PlusCircle, Loader2, ShieldOff, ShieldCheck, SquarePen } from "lucide-react";
import { getSession } from "@/utils/session";
import { useRouter } from "next/navigation";
import NotifyAlert from "@/components/NotifyAlert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import PageErrorState from "@/components/ui/PageErrorState";
import { getDbOfflineToastMessage, getErrorKindByMeta, isDbOfflineMeta } from "@/utils/ui-errors";
import { ApiResponseError } from "@/utils/functions";

type AdminUser = {
    id: number;
    full_name: string;
    email: string;
    canAccessAdmin: number;
    isRoot: number;
    registration_status: string;
};

type RegistrationItem = { id: number; full_name: string; email: string; created_by: string };
type ResetItem = { id: number; full_name: string; email: string; status: string };
type GroupItem = { id: number; name: string; fk_user: number; owner_name: string | null };
type GroupStatItem = { id: number; name: string; students_count: number; avg_grade: number | null; lessons_total: number; lessons_sick: number; late_total: number };
type LogItem = { id: number; action: string; details: string | null; created_at: string; actor_name: string | null };
type AppStats = {
    users_total: number;
    registrations_pending: number;
    admins_total: number;
    groups_total: number;
    students_total: number;
    password_resets_pending: number;
};
type AdminOverview = {
    users: AdminUser[];
    pendingRegistrations: RegistrationItem[];
    passwordResetRequests: ResetItem[];
    groups: GroupItem[];
    groupStats: GroupStatItem[];
    logs: LogItem[];
    appStats: AppStats;
};

type TabType = "groups" | "users" | "logs";

export default function AdminPage() {
    const [data, setData] = useState<AdminOverview | null>(null);
    const [userData, setUserData] = useState<{ email: string; uid: number }>(Object);
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
        if (!silent) {
            setLoading(true);
        }
        setError(null);
        try {
            const session = await getSession();
            if (!session) {
                router.push("/login?to=profile/groups");
                return;
            }
            
            setUserData({ email: session.email, uid: session.uid });

            const response = await apiGet<{ data: AdminOverview }>("/api/admin/overview");
            setData(response.data);
            
        } catch (e) {
            const fallbackMessage = e instanceof Error ? e.message : "Ошибка загрузки админ панели";
            if (e instanceof ApiResponseError) {
                setError({ message: fallbackMessage, status: e.status, code: e.code });
            } else {
                setError({ message: fallbackMessage });
            }
            setNotify({ message: fallbackMessage, type: "error" });
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [router]);

    useEffect(() => {
        void load();
    }, [load]);

    const runAction = async (action: () => Promise<void>, key: string, successMessage?: string, reloadAfter: boolean = true) => {
        setBusy(true);
        setActionKey(key);
        try {
            await action();
            if (successMessage) {
                setNotify({ message: successMessage, type: "success" });
            }
            if (reloadAfter) {
                await load(true);
            }
        } catch (e) {
            if (e instanceof ApiResponseError) {
                const dbOffline = isDbOfflineMeta(e.status, e.code);
                setNotify({
                    message: dbOffline ? getDbOfflineToastMessage() : e.message,
                    type: dbOffline ? "warning" : "error",
                });
                return;
            }
            const message = e instanceof Error ? e.message : "Ошибка выполнения операции";
            setNotify({ message, type: "error" });
        } finally {
            setBusy(false);
            setActionKey(null);
        }
    };

    const approve = async (userId: number) => {
        await runAction(async () => {
            await apiPost(`/api/admin/registrations/${userId}/approve`);
        }, `approve-${userId}`, "Заявка подтверждена");
    };

    const reject = async (userId: number) => {
        await runAction(async () => {
            await apiPost(`/api/admin/registrations/${userId}/reject`);
        }, `reject-${userId}`, "Заявка отклонена");
    };

    const toggleAccess = async (userId: number) => {
        await runAction(async () => {
            const response = await apiPost<{ data?: { userId: number; canAccessAdmin: number } }>(`/api/admin/users/${userId}/access`);
            const next = response.data;
            if (!next) return;
            setData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    users: prev.users.map((u) =>
                        u.id === next.userId ? { ...u, canAccessAdmin: next.canAccessAdmin } : u
                    ),
                    appStats: {
                        ...prev.appStats,
                        admins_total: prev.users.reduce((acc, u) => {
                            if (u.id === next.userId) return acc + (next.canAccessAdmin ? 1 : 0);
                            return acc + (u.canAccessAdmin ? 1 : 0);
                        }, 0),
                    },
                };
            });
        }, `toggle-${userId}`, "Права доступа обновлены", false);
    };

    const resolveReset = async (requestId: number) => {
        const nextPassword = (newPasswords[requestId] || "").trim();
        if (!nextPassword || nextPassword.length < 8) {
            setNotify({ message: "Введите новый пароль длиной минимум 8 символов", type: "warning" });
            return;
        }
        await runAction(async () => {
            await apiPost(`/api/admin/password-resets/${requestId}/resolve`, { newPassword: nextPassword });
            setNewPasswords((prev) => ({ ...prev, [requestId]: "" }));
            setResetRequestDialogId(null);
        }, `reset-${requestId}`, "Пароль по заявке обновлен");
    };

    const createGroup = async () => {
        const fkUser = Number(newGroupTeacherId);
        if (!newGroupName.trim() || !Number.isFinite(fkUser) || fkUser <= 0) {
            setNotify({ message: "Укажите название группы и корректного преподавателя", type: "warning" });
            return;
        }
        await runAction(async () => {
            await apiPost("/api/admin/groups", { name: newGroupName.trim(), fk_user: fkUser });
            setNewGroupName("");
            setNewGroupTeacherId("");
        }, "create-group", "Группа создана");
    };

    const saveGroup = async (groupId: number) => {
        const draft = groupDrafts[groupId];
        if (!draft) return;
        const payload: { name?: string; fk_user?: number } = {};
        if (draft.name.trim()) payload.name = draft.name.trim();
        if (draft.fk_user.trim()) payload.fk_user = Number(draft.fk_user.trim());
        await runAction(async () => {
            await apiPatch(`/api/admin/groups/${groupId}`, payload);
            setGroupEditId(null);
        }, `save-group-${groupId}`, "Группа обновлена");
    };

    const deleteGroup = async (groupId: number) => {
        await runAction(async () => {
            await apiDelete(`/api/admin/groups/${groupId}`);
            setGroupDeleteId(null);
        }, `delete-group-${groupId}`, "Группа удалена");
    };

    const saveUser = async (userId: number) => {
        const draft = userDrafts[userId];
        if (!draft) return;
        await runAction(async () => {
            await apiPatch(`/api/admin/users/${userId}`, {
                full_name: draft.full_name.trim(),
                email: draft.email.trim(),
            });
            setUserEditId(null);
        }, `save-user-${userId}`, "Пользователь обновлен");
    };

    const deleteUser = async (userId: number) => {
        await runAction(async () => {
            await apiDelete(`/api/admin/users/${userId}`);
            setUserDeleteId(null);
        }, `delete-user-${userId}`, "Пользователь удален");
    };

    const resetUserPasswordDirect = async (userId: number) => {
        const newPassword = resetPasswordDraft.trim();
        if (newPassword.length < 8) {
            setNotify({ message: "Пароль должен быть длиной минимум 8 символов", type: "warning" });
            return;
        }
        await runAction(async () => {
            await apiPost(`/api/admin/users/${userId}/reset-password`, { newPassword });
            setUserResetId(null);
            setResetPasswordDraft("");
        }, `direct-reset-${userId}`, "Пароль пользователя обновлен");
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-6">
                <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                        <div>
                            <p className="font-semibold">Загружаю админ-панель</p>
                            <p className="text-sm text-muted-foreground">Подготавливаю данные групп, пользователей и логов</p>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div
                                className="h-full w-1/3 bg-blue-600 rounded-full"
                                animate={{ x: ["-20%", "220%"] }}
                                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>
                        <div className="text-xs text-muted-foreground">Это займет несколько секунд</div>
                    </div>
                </div>
            </div>
        );
    }
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
    const teacherOptions = data.users.filter((u) => u.registration_status === "approved");
    const editingGroup = groupEditId ? data.groups.find((g) => g.id === groupEditId) : null;
    const editingUser = userEditId ? data.users.find((u) => u.id === userEditId) : null;
    const deletingGroup = groupDeleteId ? data.groups.find((g) => g.id === groupDeleteId) : null;
    const deletingUser = userDeleteId ? data.users.find((u) => u.id === userDeleteId) : null;
    const resettingUser = userResetId ? data.users.find((u) => u.id === userResetId) : null;

    return (
        <div className="w-[90%] mx-auto space-y-8 animate-in fade-in duration-500 bg-background min-h-screen py-4">
            {notify.message ? <NotifyAlert message={notify.message} type={notify.type} onClose={() => setNotify({ message: "", type: "" })} /> : null}
            <div className="grid gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Админ панель</h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Управление доступами, группами и операционными процессами</p>
                </div>

            <section className="grid grid-cols-2 lg:grid-cols-6 gap-2">
                <StatCard icon={<Users />} label="Пользователей" value={data.appStats.users_total} />
                <StatCard icon={<Shield />} label="Админов" value={data.appStats.admins_total} />
                <StatCard icon={<Layers />} label="Групп" value={data.appStats.groups_total} />
                <StatCard icon={<UserCog />} label="Студентов" value={data.appStats.students_total} />
                <StatCard icon={<Clock3 />} label="Регистраций в очереди" value={data.appStats.registrations_pending} />
                <StatCard icon={<KeyRound />} label="Сбросов паролей в очереди" value={data.appStats.password_resets_pending} />
            </section>

            <div className="w-full overflow-x-auto">
                <div className="flex gap-2 p-1 bg-card rounded-2xl border border-border w-fit shadow-inner relative overflow-hidden">
                    <TabButton active={tab === "groups"} label="Группы" onClick={() => setTab("groups")} />
                    <TabButton active={tab === "users"} label="Пользователи и безопасность" onClick={() => setTab("users")} />
                    <TabButton active={tab === "logs"} label="Логи" onClick={() => setTab("logs")} />
                </div>
            </div>

            <div className="p-1 overflow-hidden min-h-[560px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
            {tab === "groups" ? (
                <section className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Обзор и управление группами</h2>
                    <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 w-fit">
                        <div className="flex sm:flex-row flex-col gap-2">
                            <input className="border border-border rounded-xl px-3 py-2 bg-background" placeholder="Название группы" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                            <select className="border border-border rounded-xl px-3 py-2 bg-background" value={newGroupTeacherId} onChange={(e) => setNewGroupTeacherId(e.target.value)}>
                                <option value="">Выберите преподавателя</option>
                                {teacherOptions.map((u) => (
                                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                                ))}
                            </select>
                            <ActionButton loading={actionKey === "create-group"} disabled={busy} onClick={createGroup} className="rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold px-3 py-2 text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                <PlusCircle className="w-4 h-4" /> Создать
                            </ActionButton>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-4">
                    {data.groups.map((group) => {
                        const isOwner = group.fk_user === userData.uid;
                        const stat = data.groupStats.find((g) => g.id === group.id);
                        const attendancePercent = stat && stat.lessons_total > 0
                            ? (((stat.lessons_total - stat.lessons_sick) / stat.lessons_total) * 100).toFixed(1)
                            : "0";
                        return (
                            <div key={group.id} className="group relative flex flex-col p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-3 rounded-xl transition-colors ${
                                        isOwner
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    }`}>
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div className='flex sm:flex-row flex-col items-end gap-2'>
                                        {isOwner && (
                                            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-blue-600 text-white rounded-full shadow-sm">
                                                Ваша группа
                                            </span>
                                        )}
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 rounded-full border border-gray-200 dark:border-zinc-700">
                                            ID: {group.id}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold tracking-tight mb-2">{group.name}</h3>
                                <div className="space-y-1 text-sm text-muted-foreground mb-4">
                                    <p>Владелец: {group.owner_name || "—"}</p>
                                    <p>Студентов: {stat?.students_count ?? 0} | Ср. балл: {stat?.avg_grade ?? "—"}</p>
                                    <p>Посещаемость: {attendancePercent}% | Опоздания: {stat?.late_total ?? 0}</p>
                                </div>
                                <div className="flex sm:flex-row flex-col gap-2 w-full items-center">
                                    <Button
                                        className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium rounded-lg text-sm transition-all w-full"
                                        onClick={() => {
                                            setGroupDrafts((prev) => ({ ...prev, [group.id]: { name: group.name, fk_user: String(group.fk_user) } }));
                                            setGroupEditId(group.id);
                                        }}
                                    >
                                        <SquarePen className="w-4 h-4" /> Редактировать
                                    </Button>
                                    <ActionButton loading={actionKey === `delete-group-${group.id}`} disabled={busy} onClick={() => setGroupDeleteId(group.id)} className="w-full rounded-lg bg-red-50 dark:bg-zinc-700/50 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Удалить</ActionButton>
                                    </div>
                                </div>
                        );
                    })}
                    </div>
                </section>
            ) : null}

            {tab === "users" ? (
                <section className="grid gap-5">
                    <h2 className="text-xl font-bold">Пользователи и безопасность</h2>
                    <div className="grid gap-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-4">
                            {data.users.map((item) => {
                                return (
                                    <div key={`manage-${item.id}`} className="group relative flex flex-col p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="p-3 rounded-xl bg-muted text-muted-foreground">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div className="flex sm:flex-row flex-col items-end gap-2">
                                                {item.isRoot ? (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 rounded-full border border-amber-200 dark:border-amber-800">
                                                        Root
                                                    </span>
                                                ) : null}
                                                
                                                {item.canAccessAdmin ? (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
                                                        Админ доступ
                                                    </span>
                                                ) : null}
                                                
                                                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-muted text-muted-foreground rounded-full border border-border">
                                                    ID: {item.id}
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold tracking-tight">{item.full_name}</h3>
                                        <p className="text-sm text-muted-foreground mb-4">{item.email}</p>

                                        <div className="grid grid-cols-2 gap-2 mt-auto">
                                            <Button
                                                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium rounded-lg text-sm transition-all"
                                                onClick={() => {
                                                    setUserDrafts((prev) => ({ ...prev, [item.id]: { full_name: item.full_name, email: item.email } }));
                                                    setUserEditId(item.id);
                                                }}
                                            >
                                                <SquarePen className="w-4 h-4" /> Редактировать
                                            </Button>
                                            
                                            <ActionButton 
                                                loading={actionKey === `delete-user-${item.id}`} 
                                                disabled={busy || item.isRoot === 1} 
                                                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white text-sm font-medium transition-colors disabled:opacity-60" 
                                                onClick={() => setUserDeleteId(item.id)}
                                            >
                                                <Trash2 className="w-4 h-4" /> Удалить
                                            </ActionButton>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <Button 
                                                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/80 dark:bg-zinc-800/80 hover:bg-muted dark:hover:bg-zinc-700 text-foreground text-sm font-medium transition-all" 
                                                onClick={() => { setResetPasswordDraft(""); setUserResetId(item.id); }}
                                            >
                                                <KeyRound className="w-4 h-4" /> Сменить пароль
                                            </Button>
                                            
                                            <ActionButton 
                                                loading={actionKey === `toggle-${item.id}`} 
                                                disabled={busy || item.isRoot === 1} 
                                                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/80 dark:bg-zinc-800/80 hover:bg-muted dark:hover:bg-zinc-700 text-foreground text-sm font-medium transition-all disabled:opacity-60" 
                                                onClick={() => toggleAccess(item.id)}
                                            >
                                                {item.canAccessAdmin ? (
                                                    <>
                                                        <ShieldOff className="w-4 h-4 text-orange-500" /> Забрать доступ
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShieldCheck className="w-4 h-4 text-blue-500" /> Выдать доступ
                                                    </>
                                                )}
                                            </ActionButton>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <h3 className="font-semibold">Заявки на регистрацию</h3>
                        {data.pendingRegistrations.length === 0 ? <p className="text-sm text-muted-foreground">Нет заявок</p> : null}
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-2">
                        {data.pendingRegistrations.map((item) => (
                            <div key={item.id} className="border border-border rounded-xl p-3 grid gap-3">
                                <div><p>{item.full_name}</p><p className="text-sm text-muted-foreground">{item.email}</p></div>
                                <div className="flex gap-2">
                                    <ActionButton loading={actionKey === `approve-${item.id}`} disabled={busy} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white text-sm font-medium transition-all disabled:opacity-60 flex items-center gap-1" onClick={() => approve(item.id)}><CheckCircle2 className="w-4 h-4" /> Подтвердить</ActionButton>
                                    <ActionButton loading={actionKey === `reject-${item.id}`} disabled={busy} className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-zinc-700/50 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white text-sm font-medium transition-colors disabled:opacity-60" onClick={() => reject(item.id)}>Отклонить</ActionButton>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    {data.passwordResetRequests.length === 0 ? <p className="text-sm text-muted-foreground">Нет заявок</p> : null}
                    <div className="grid gap-2">
                    <h3 className="font-semibold">Заявки на сброс пароля</h3>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-2">
                    {data.passwordResetRequests.map((item) => (
                        <div key={item.id} className="border border-border rounded-xl p-3 grid gap-2">
                            <p>{item.full_name} ({item.email})</p>
                            <p className="text-sm text-muted-foreground">Статус: {item.status}</p>
                            {item.status === "pending" ? (
                                <div className="grid sm:grid-cols-[1fr_auto] gap-2">
                                    <Button className="rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-3 py-2 text-sm font-medium transition-all" onClick={() => setResetRequestDialogId(item.id)}>
                                        Открыть диалог сброса
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    ))}
                    </div>
                    </div>
                </section>
            ) : null}

            {tab === "logs" ? (
                <section className="grid gap-2">
                    <h2 className="text-xl font-bold">Логи действий админов</h2>
                    <div className="grid gap-2">
                    {data.logs.map((log) => (
                        <div key={log.id} className="border border-border rounded-xl p-3 text-sm">
                            [{log.created_at}] {log.actor_name || "unknown"} - {log.action} {log.details ? `(${log.details})` : ""}
                        </div>
                    ))}
                    </div>
                </section>
            ) : null}
                    </motion.div>
                </AnimatePresence>
            </div>
            </div>

            <Dialog open={groupEditId !== null} onOpenChange={(open) => !open && setGroupEditId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Редактирование группы</DialogTitle>
                        <DialogDescription>Измените название и преподавателя группы.</DialogDescription>
                    </DialogHeader>
                    {editingGroup ? (
                        <div className="grid gap-3">
                            <input className="border border-border rounded-xl px-3 py-2 bg-background" value={(groupDrafts[editingGroup.id] || { name: editingGroup.name, fk_user: String(editingGroup.fk_user) }).name} onChange={(e) => setGroupDrafts((prev) => ({ ...prev, [editingGroup.id]: { ...(prev[editingGroup.id] || { name: editingGroup.name, fk_user: String(editingGroup.fk_user) }), name: e.target.value } }))} />
                            <select className="border border-border rounded-xl px-3 py-2 bg-background" value={(groupDrafts[editingGroup.id] || { name: editingGroup.name, fk_user: String(editingGroup.fk_user) }).fk_user} onChange={(e) => setGroupDrafts((prev) => ({ ...prev, [editingGroup.id]: { ...(prev[editingGroup.id] || { name: editingGroup.name, fk_user: String(editingGroup.fk_user) }), fk_user: e.target.value } }))}>
                                <option value="">Выберите преподавателя</option>
                                {teacherOptions.map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                            </select>
                        </div>
                    ) : null}
                    <DialogFooter>
                        <ActionButton loading={actionKey === `save-group-${groupEditId}`} disabled={busy || !groupEditId} onClick={() => groupEditId && saveGroup(groupEditId)} className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2">Сохранить</ActionButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={groupDeleteId !== null} onOpenChange={(open) => !open && setGroupDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удаление группы</DialogTitle>
                        <DialogDescription>Удалить группу «{deletingGroup?.name || ""}»? Это удалит связанные данные посещаемости, оценок и студентов.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <ActionButton loading={actionKey === `delete-group-${groupDeleteId}`} disabled={busy || !groupDeleteId} onClick={() => groupDeleteId && deleteGroup(groupDeleteId)} className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2">Да, удалить</ActionButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={userEditId !== null} onOpenChange={(open) => !open && setUserEditId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Редактирование пользователя</DialogTitle>
                        <DialogDescription>Измените ФИО и email пользователя.</DialogDescription>
                    </DialogHeader>
                    {editingUser ? (
                        <div className="grid gap-3">
                            <input className="border border-border rounded-xl px-3 py-2 bg-background" value={(userDrafts[editingUser.id] || { full_name: editingUser.full_name, email: editingUser.email }).full_name} onChange={(e) => setUserDrafts((prev) => ({ ...prev, [editingUser.id]: { ...(prev[editingUser.id] || { full_name: editingUser.full_name, email: editingUser.email }), full_name: e.target.value } }))} />
                            <input className="border border-border rounded-xl px-3 py-2 bg-background" value={(userDrafts[editingUser.id] || { full_name: editingUser.full_name, email: editingUser.email }).email} onChange={(e) => setUserDrafts((prev) => ({ ...prev, [editingUser.id]: { ...(prev[editingUser.id] || { full_name: editingUser.full_name, email: editingUser.email }), email: e.target.value } }))} />
                        </div>
                    ) : null}
                    <DialogFooter>
                        <ActionButton loading={actionKey === `save-user-${userEditId}`} disabled={busy || !userEditId} onClick={() => userEditId && saveUser(userEditId)} className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2">Сохранить</ActionButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={userResetId !== null} onOpenChange={(open) => !open && setUserResetId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Сброс пароля</DialogTitle>
                        <DialogDescription>Введите новый пароль для пользователя {resettingUser?.full_name || ""}.</DialogDescription>
                    </DialogHeader>
                    <input className="border border-border rounded-xl px-3 py-2 bg-background" placeholder="Новый пароль (минимум 8 символов)" value={resetPasswordDraft} onChange={(e) => setResetPasswordDraft(e.target.value)} />
                    <DialogFooter>
                        <ActionButton loading={actionKey === `direct-reset-${userResetId}`} disabled={busy || !userResetId} onClick={() => userResetId && resetUserPasswordDirect(userResetId)} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2">Обновить пароль</ActionButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={userDeleteId !== null} onOpenChange={(open) => !open && setUserDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удаление пользователя</DialogTitle>
                        <DialogDescription>Удалить пользователя «{deletingUser?.full_name || ""}»? Действие необратимо.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <ActionButton loading={actionKey === `delete-user-${userDeleteId}`} disabled={busy || !userDeleteId} onClick={() => userDeleteId && deleteUser(userDeleteId)} className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2">Да, удалить</ActionButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={resetRequestDialogId !== null} onOpenChange={(open) => !open && setResetRequestDialogId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Сброс по заявке</DialogTitle>
                        <DialogDescription>Введите новый пароль для обработки заявки.</DialogDescription>
                    </DialogHeader>
                    {resetRequestDialogId ? (
                        <input className="border border-border rounded-xl px-3 py-2 bg-background" placeholder="Новый пароль (минимум 8 символов)" value={newPasswords[resetRequestDialogId] || ""} onChange={(e) => setNewPasswords((prev) => ({ ...prev, [resetRequestDialogId]: e.target.value }))} />
                    ) : null}
                    <DialogFooter>
                        <ActionButton loading={actionKey === `reset-${resetRequestDialogId}`} disabled={busy || !resetRequestDialogId} onClick={() => resetRequestDialogId && resolveReset(resetRequestDialogId)} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2">Сбросить пароль</ActionButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: number;
}) {
    const colorMap: Record<string, { border: string; icon: string; iconBg: string }> = {
        "Пользователей": { border: "border-gray-100 dark:border-zinc-700", icon: "text-blue-600 dark:text-blue-400", iconBg: "bg-gray-100 dark:bg-zinc-700/50" },
        "Регистраций в очереди": { border: "border-gray-100 dark:border-zinc-700", icon: "text-amber-600 dark:text-amber-400", iconBg: "bg-gray-100 dark:bg-zinc-700/50" },
        "Админов": { border: "border-gray-100 dark:border-zinc-700", icon: "text-violet-600 dark:text-violet-400", iconBg: "bg-gray-100 dark:bg-zinc-700/50" },
        "Групп": { border: "border-gray-100 dark:border-zinc-700", icon: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-gray-100 dark:bg-zinc-700/50" },
        "Студентов": { border: "border-gray-100 dark:border-zinc-700", icon: "text-cyan-600 dark:text-cyan-400", iconBg: "bg-gray-100 dark:bg-zinc-700/50" },
        "Сбросов паролей в очереди": { border: "border-gray-100 dark:border-zinc-700", icon: "text-rose-600 dark:text-rose-400", iconBg: "bg-gray-100 dark:bg-zinc-700/50" },
    };
    const tone = colorMap[label] || { border: "border-border", icon: "text-muted-foreground", iconBg: "bg-muted" };
    return (
        <div className={`bg-card p-5 rounded-lg border ${tone.border} shadow-sm hover:shadow-md transition-all duration-300 group`}>
            <div className={`${tone.iconBg} ${tone.icon} w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <div className="[&>svg]:w-5 [&>svg]:h-5">{icon}</div>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1 tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        </div>
    );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 h-10 min-h-10 whitespace-nowrap text-center min-w-[160px] z-10 ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
        >
            {active ? (
                <motion.div
                    layoutId="adminActiveTab"
                    className="absolute inset-0 bg-card border border-border rounded-xl shadow-sm -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
            ) : null}
            {label}
        </button>
    );
}

function ActionButton({
    loading,
    className,
    children,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
    return (
        <Button {...props} disabled={props.disabled || loading} className={className}>
            <span className="inline-flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {children}
            </span>
        </Button>
    );
}

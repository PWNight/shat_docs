"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiGet, apiPost } from "@/utils/http-client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock3, Shield, Users, UserCog, Layers, KeyRound, Trash2, Save, PlusCircle, Loader2, ArrowUpRight } from "lucide-react";
import { getSession } from "@/utils/session";
import { useRouter } from "next/navigation";

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
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<TabType>("groups");
    const [newPasswords, setNewPasswords] = useState<Record<number, string>>({});
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupTeacherId, setNewGroupTeacherId] = useState("");
    const [groupDrafts, setGroupDrafts] = useState<Record<number, { name: string; fk_user: string }>>({});
    const [userDrafts, setUserDrafts] = useState<Record<number, { full_name: string; email: string }>>({});
    const [busy, setBusy] = useState(false);
    const [actionKey, setActionKey] = useState<string | null>(null);
    const [selectedAccessUserId, setSelectedAccessUserId] = useState("");
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

            const response = await apiGet<{ data: AdminOverview }>("/api/v2/admin/overview");
            setData(response.data);
            
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ошибка загрузки админ панели");
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const runAction = async (action: () => Promise<void>, key: string, reloadAfter: boolean = true) => {
        setBusy(true);
        setActionKey(key);
        try {
            await action();
            if (reloadAfter) {
                await load(true);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ошибка выполнения операции");
        } finally {
            setBusy(false);
            setActionKey(null);
        }
    };

    const approve = async (userId: number) => {
        await runAction(async () => {
            await apiPost(`/api/v2/admin/registrations/${userId}/approve`);
        }, `approve-${userId}`);
    };

    const reject = async (userId: number) => {
        await runAction(async () => {
            await apiPost(`/api/v2/admin/registrations/${userId}/reject`);
        }, `reject-${userId}`);
    };

    const toggleAccess = async (userId: number) => {
        await runAction(async () => {
            const response = await apiPost<{ data?: { userId: number; canAccessAdmin: number } }>(`/api/v2/admin/users/${userId}/access`);
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
        }, `toggle-${userId}`, false);
    };

    const resolveReset = async (requestId: number) => {
        const nextPassword = (newPasswords[requestId] || "").trim();
        if (!nextPassword || nextPassword.length < 8) {
            alert("Введите новый пароль длиной минимум 8 символов");
            return;
        }
        await runAction(async () => {
            await apiPost(`/api/v2/admin/password-resets/${requestId}/resolve`, { newPassword: nextPassword });
            setNewPasswords((prev) => ({ ...prev, [requestId]: "" }));
        }, `reset-${requestId}`);
    };

    const createGroup = async () => {
        const fkUser = Number(newGroupTeacherId);
        if (!newGroupName.trim() || !Number.isFinite(fkUser) || fkUser <= 0) {
            alert("Укажите название группы и корректный ID преподавателя");
            return;
        }
        await runAction(async () => {
            await apiPost("/api/v2/admin/groups", { name: newGroupName.trim(), fk_user: fkUser });
            setNewGroupName("");
            setNewGroupTeacherId("");
        }, "create-group");
    };

    const saveGroup = async (groupId: number) => {
        const draft = groupDrafts[groupId];
        if (!draft) return;
        const payload: { name?: string; fk_user?: number } = {};
        if (draft.name.trim()) payload.name = draft.name.trim();
        if (draft.fk_user.trim()) payload.fk_user = Number(draft.fk_user.trim());
        await runAction(async () => {
            await fetch(`/api/v2/admin/groups/${groupId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }).then(async (res) => {
                if (!res.ok) throw new Error((await res.json()).message || "Ошибка обновления группы");
            });
        }, `save-group-${groupId}`);
    };

    const deleteGroup = async (groupId: number) => {
        if (!confirm("Удалить группу? Это удалит связанные данные посещаемости/оценок/студентов.")) return;
        await runAction(async () => {
            await fetch(`/api/v2/admin/groups/${groupId}`, { method: "DELETE" }).then(async (res) => {
                if (!res.ok) throw new Error((await res.json()).message || "Ошибка удаления группы");
            });
        }, `delete-group-${groupId}`);
    };

    const saveUser = async (userId: number) => {
        const draft = userDrafts[userId];
        if (!draft) return;
        await runAction(async () => {
            await fetch(`/api/v2/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: draft.full_name.trim(),
                    email: draft.email.trim(),
                }),
            }).then(async (res) => {
                if (!res.ok) throw new Error((await res.json()).message || "Ошибка обновления пользователя");
            });
        }, `save-user-${userId}`);
    };

    const deleteUser = async (userId: number) => {
        if (!confirm("Удалить пользователя? Действие необратимо.")) return;
        await runAction(async () => {
            await fetch(`/api/v2/admin/users/${userId}`, { method: "DELETE" }).then(async (res) => {
                if (!res.ok) throw new Error((await res.json()).message || "Ошибка удаления пользователя");
            });
        }, `delete-user-${userId}`);
    };

    const resetUserPasswordDirect = async (userId: number) => {
        const newPassword = prompt("Введите новый пароль (мин. 8 символов)");
        if (!newPassword) return;
        if (newPassword.trim().length < 8) {
            alert("Пароль должен быть длиной минимум 8 символов");
            return;
        }
        await runAction(async () => {
            await apiPost(`/api/v2/admin/users/${userId}/reset-password`, { newPassword: newPassword.trim() });
        }, `direct-reset-${userId}`);
    };

    if (loading) return <div className="p-8">Загрузка...</div>;
    if (error) return <div className="p-8 text-red-500">Ошибка: {error}</div>;
    if (!data) return null;
    const teacherOptions = data.users.filter((u) => u.registration_status === "approved");

    return (
        <div className="relative w-full animate-in fade-in duration-500 bg-background min-h-screen p-4 sm:p-6">
            <div className="mx-auto max-w-7xl grid gap-6">
            <div className="grid md:grid-cols-[1fr_auto] items-start md:items-center gap-4 border-b border-border/70 pb-5">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Админ панель</h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Управление доступами, группами и операционными процессами</p>
                </div>
                <Link href="/profile" className="rounded-xl border border-border bg-card px-4 py-2 text-foreground text-sm font-semibold hover:bg-muted self-start inline-flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4" />
                    Личный кабинет
                </Link>
            </div>

            <section className="grid grid-cols-2 lg:grid-cols-6 gap-2">
                <StatCard icon={<Users />} label="Пользователи" value={data.appStats.users_total} />
                <StatCard icon={<Clock3 />} label="Ожидают регистрацию" value={data.appStats.registrations_pending} />
                <StatCard icon={<Shield />} label="Админов" value={data.appStats.admins_total} />
                <StatCard icon={<Layers />} label="Групп" value={data.appStats.groups_total} />
                <StatCard icon={<UserCog />} label="Студентов" value={data.appStats.students_total} />
                <StatCard icon={<KeyRound />} label="Сбросов пароля" value={data.appStats.password_resets_pending} />
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
                            <ActionButton loading={actionKey === "create-group"} disabled={busy} onClick={createGroup} className="rounded-xl bg-blue-600 text-white font-semibold px-3 py-2 hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                                <PlusCircle className="w-4 h-4" /> Создать
                            </ActionButton>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {data.groups.map((group) => {
                        const isOwner = group.fk_user === userData.uid;
                        const draft = groupDrafts[group.id] || { name: group.name, fk_user: String(group.fk_user) };
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
                                <div className="flex flex-col gap-2 mt-auto w-full">
                                    <input className="border border-border rounded-xl px-3 py-2 bg-background" value={draft.name} onChange={(e) => setGroupDrafts((prev) => ({ ...prev, [group.id]: { ...draft, name: e.target.value } }))} />
                                    <select className="border border-border rounded-xl px-3 py-2 bg-background" value={draft.fk_user} onChange={(e) => setGroupDrafts((prev) => ({ ...prev, [group.id]: { ...draft, fk_user: e.target.value } }))}>
                                        <option value="">Выберите преподавателя</option>
                                        {teacherOptions.map((u) => (
                                            <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                                        ))}
                                    </select>
                                    <div className="flex sm:flex-row flex-col gap-2 w-full items-center">
                                        <ActionButton loading={actionKey === `save-group-${group.id}`} disabled={busy} onClick={() => saveGroup(group.id)} className="w-full rounded-xl bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-2"><Save className="w-4 h-4" /> Сохранить</ActionButton>
                                        <ActionButton loading={actionKey === `delete-group-${group.id}`} disabled={busy} onClick={() => deleteGroup(group.id)} className="w-full rounded-xl bg-rose-600 text-white px-3 py-2 hover:bg-rose-700 disabled:opacity-60 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Удалить</ActionButton>
                                    </div>
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
                    <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end border border-border rounded-xl p-3">
                        <select className="border border-border rounded-xl px-3 py-2 bg-background" value={selectedAccessUserId} onChange={(e) => setSelectedAccessUserId(e.target.value)}>
                            <option value="">Выберите преподавателя для выдачи/отзыва доступа</option>
                            {teacherOptions.map((u) => (
                                <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                            ))}
                        </select>
                        <ActionButton
                            loading={actionKey === `toggle-${selectedAccessUserId}`}
                            disabled={busy || !selectedAccessUserId}
                            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60 hover:bg-blue-700"
                            onClick={() => toggleAccess(Number(selectedAccessUserId))}
                        >
                            Выдать / забрать доступ
                        </ActionButton>
                    </div>
                    <div className="grid gap-2">
                        <h3 className="font-semibold">Полное управление пользователями</h3>
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
                            {data.users.map((item) => {
                                const draft = userDrafts[item.id] || { full_name: item.full_name, email: item.email };
                                return (
                                    <div key={`manage-${item.id}`} className="border border-border rounded-xl p-3 grid gap-2">
                                        <p className="text-xs text-muted-foreground">ID: {item.id} {item.isRoot ? "| root" : ""}</p>
                                        <input
                                            className="border border-border rounded-xl px-3 py-2 bg-background"
                                            value={draft.full_name}
                                            onChange={(e) => setUserDrafts((prev) => ({ ...prev, [item.id]: { ...draft, full_name: e.target.value } }))}
                                            placeholder="ФИО"
                                        />
                                        <input
                                            className="border border-border rounded-xl px-3 py-2 bg-background"
                                            value={draft.email}
                                            onChange={(e) => setUserDrafts((prev) => ({ ...prev, [item.id]: { ...draft, email: e.target.value } }))}
                                            placeholder="Email"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <ActionButton loading={actionKey === `save-user-${item.id}`} disabled={busy} className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-60 flex items-center justify-center gap-1 hover:bg-emerald-700" onClick={() => saveUser(item.id)}>
                                                <Save className="w-4 h-4" /> Сохранить
                                            </ActionButton>
                                            <ActionButton loading={actionKey === `direct-reset-${item.id}`} disabled={busy} className="px-3 py-2 rounded bg-violet-600 text-white disabled:opacity-60 hover:bg-violet-700" onClick={() => resetUserPasswordDirect(item.id)}>
                                                Сброс пароля
                                            </ActionButton>
                                        </div>
                                        <ActionButton loading={actionKey === `delete-user-${item.id}`} disabled={busy || item.isRoot === 1} className="px-3 py-2 rounded bg-rose-600 text-white disabled:opacity-60 hover:bg-rose-700" onClick={() => deleteUser(item.id)}>
                                            Удалить пользователя
                                        </ActionButton>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <h3 className="font-semibold">Заявки на регистрацию</h3>
                        {data.pendingRegistrations.length === 0 ? <p className="text-sm text-muted-foreground">Нет заявок</p> : null}
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
                        {data.pendingRegistrations.map((item) => (
                            <div key={item.id} className="border border-border rounded-xl p-3 grid gap-3">
                                <div><p>{item.full_name}</p><p className="text-sm text-muted-foreground">{item.email}</p></div>
                                <div className="flex gap-2">
                                    <ActionButton loading={actionKey === `approve-${item.id}`} disabled={busy} className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-60 flex items-center gap-1 hover:bg-emerald-700" onClick={() => approve(item.id)}><CheckCircle2 className="w-4 h-4" /> Подтвердить</ActionButton>
                                    <ActionButton loading={actionKey === `reject-${item.id}`} disabled={busy} className="px-3 py-1 rounded bg-rose-600 text-white disabled:opacity-60 hover:bg-rose-700" onClick={() => reject(item.id)}>Отклонить</ActionButton>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <h3 className="font-semibold">Права на админ-панель</h3>
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
                        {data.users.map((item) => (
                            <div key={item.id} className="border border-border rounded-xl p-3 grid gap-3">
                                <div><p>{item.full_name} {item.isRoot ? "(root)" : ""}</p><p className="text-sm text-muted-foreground">{item.email}</p></div>
                                <ActionButton loading={actionKey === `toggle-${item.id}`} disabled={busy || item.isRoot === 1} className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-60 hover:bg-blue-700" onClick={() => toggleAccess(item.id)}>
                                    {item.canAccessAdmin ? "Забрать доступ" : "Выдать доступ"}
                                </ActionButton>
                            </div>
                        ))}
                        </div>
                    </div>
                    {data.passwordResetRequests.length === 0 ? <p className="text-sm text-muted-foreground">Нет заявок</p> : null}
                    <div className="grid gap-2">
                    <h3 className="font-semibold">Заявки на сброс пароля</h3>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
                    {data.passwordResetRequests.map((item) => (
                        <div key={item.id} className="border border-border rounded-xl p-3 grid gap-2">
                            <p>{item.full_name} ({item.email})</p>
                            <p className="text-sm text-muted-foreground">Статус: {item.status}</p>
                            {item.status === "pending" ? (
                                <div className="grid sm:grid-cols-[1fr_auto] gap-2">
                                    <input className="border border-border rounded-xl px-3 py-2 bg-background" placeholder="Новый пароль" value={newPasswords[item.id] || ""} onChange={(e) => setNewPasswords((prev) => ({ ...prev, [item.id]: e.target.value }))} />
                                    <ActionButton loading={actionKey === `reset-${item.id}`} disabled={busy} className="rounded-xl bg-violet-600 text-white px-3 py-2 hover:bg-violet-700 disabled:opacity-60" onClick={() => resolveReset(item.id)}>Сбросить пароль</ActionButton>
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
    const colorMap: Record<string, string> = {
        "Пользователи": "border-blue-300/80 dark:border-blue-400/45 bg-blue-100/80 dark:bg-blue-400/22",
        "Ожидают регистрацию": "border-amber-300/80 dark:border-amber-400/45 bg-amber-100/80 dark:bg-amber-400/22",
        "Админов": "border-violet-300/80 dark:border-violet-400/45 bg-violet-100/80 dark:bg-violet-400/22",
        "Групп": "border-emerald-300/80 dark:border-emerald-400/45 bg-emerald-100/80 dark:bg-emerald-400/22",
        "Студентов": "border-cyan-300/80 dark:border-cyan-400/45 bg-cyan-100/80 dark:bg-cyan-400/22",
        "Сбросов пароля": "border-rose-300/80 dark:border-rose-400/45 bg-rose-100/80 dark:bg-rose-400/22",
    };
    return (
        <div className={`p-3 rounded-xl border ${colorMap[label] || "border-border bg-card"}`}>
            <div className="mb-2 text-muted-foreground [&>svg]:w-4 [&>svg]:h-4">{icon}</div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
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
        <button {...props} disabled={props.disabled || loading} className={className}>
            <span className="inline-flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {children}
            </span>
        </button>
    );
}

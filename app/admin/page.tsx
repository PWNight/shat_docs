"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiGet, apiPost } from "@/utils/http-client";
import Link from "next/link";
import { BarChart3, CheckCircle2, Clock3, Shield, Users, UserCog, Layers, KeyRound, Trash2, Save, PlusCircle } from "lucide-react";

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

type TabType = "overview" | "groups" | "users" | "security" | "logs";

export default function AdminPage() {
    const [data, setData] = useState<AdminOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<TabType>("overview");
    const [newPasswords, setNewPasswords] = useState<Record<number, string>>({});
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupTeacherId, setNewGroupTeacherId] = useState("");
    const [groupDrafts, setGroupDrafts] = useState<Record<number, { name: string; fk_user: string }>>({});
    const [busy, setBusy] = useState(false);
    const [selectedAccessUserId, setSelectedAccessUserId] = useState("");

    const load = useCallback(async (silent: boolean = false) => {
        if (!silent) {
            setLoading(true);
        }
        setError(null);
        try {
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

    const runAction = async (action: () => Promise<void>, reloadAfter: boolean = true) => {
        setBusy(true);
        try {
            await action();
            if (reloadAfter) {
                await load(true);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ошибка выполнения операции");
        } finally {
            setBusy(false);
        }
    };

    const approve = async (userId: number) => {
        await runAction(async () => {
            await apiPost(`/api/v2/admin/registrations/${userId}/approve`);
        });
    };

    const reject = async (userId: number) => {
        await runAction(async () => {
            await apiPost(`/api/v2/admin/registrations/${userId}/reject`);
        });
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
        }, false);
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
        });
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
        });
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
        });
    };

    const deleteGroup = async (groupId: number) => {
        if (!confirm("Удалить группу? Это удалит связанные данные посещаемости/оценок/студентов.")) return;
        await runAction(async () => {
            await fetch(`/api/v2/admin/groups/${groupId}`, { method: "DELETE" }).then(async (res) => {
                if (!res.ok) throw new Error((await res.json()).message || "Ошибка удаления группы");
            });
        });
    };

    if (loading) return <div className="p-8">Загрузка...</div>;
    if (error) return <div className="p-8 text-red-500">Ошибка: {error}</div>;
    if (!data) return null;
    const teacherOptions = data.users.filter((u) => u.registration_status === "approved");

    return (
        <div className="w-full grid gap-8 animate-in fade-in duration-500 bg-background min-h-screen p-4 sm:p-6">
            <div className="grid md:grid-cols-[1fr_auto] items-start md:items-center gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Админ панель</h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Управление доступами, группами и операционными процессами</p>
                </div>
                <Link href="/profile" className="rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-semibold hover:bg-blue-700 self-start">
                    В личный кабинет
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                <StatCard icon={<Users />} label="Пользователи" value={data.appStats.users_total} />
                <StatCard icon={<Clock3 />} label="Ожидают регистрацию" value={data.appStats.registrations_pending} />
                <StatCard icon={<Shield />} label="Админов" value={data.appStats.admins_total} />
                <StatCard icon={<Layers />} label="Групп" value={data.appStats.groups_total} />
                <StatCard icon={<UserCog />} label="Студентов" value={data.appStats.students_total} />
                <StatCard icon={<KeyRound />} label="Сброс пароля (pending)" value={data.appStats.password_resets_pending} />
            </div>

            <div className="w-full overflow-x-auto">
                <div className="inline-flex h-[60px] items-center gap-1.5 p-1.5 bg-card rounded-2xl border border-border w-fit shadow-inner relative">
                    <TabButton active={tab === "overview"} label="Обзор" onClick={() => setTab("overview")} />
                    <TabButton active={tab === "groups"} label="Группы" onClick={() => setTab("groups")} />
                    <TabButton active={tab === "users"} label="Пользователи" onClick={() => setTab("users")} />
                    <TabButton active={tab === "security"} label="Безопасность" onClick={() => setTab("security")} />
                    <TabButton active={tab === "logs"} label="Логи" onClick={() => setTab("logs")} />
                </div>
            </div>

            <div className="min-h-[520px]">
            {tab === "overview" ? (
                <section className="bg-card/80 backdrop-blur-sm border border-border p-6 rounded-2xl shadow-sm grid gap-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><BarChart3 className="w-5 h-5 text-cyan-500" /> Статистика по группам</h2>
                    <div className="grid lg:grid-cols-2 gap-3">
                    {data.groupStats.map((g) => {
                        const attendancePercent = g.lessons_total > 0 ? (((g.lessons_total - g.lessons_sick) / g.lessons_total) * 100).toFixed(1) : "0";
                        return (
                            <div key={g.id} className="border border-border/70 rounded-xl p-4 grid md:grid-cols-[1fr_auto] gap-2 bg-gradient-to-b from-background to-background/80">
                                <div>
                                    <p className="font-semibold">{g.name}</p>
                                    <p className="text-sm text-muted-foreground">Студентов: {g.students_count} | Средний балл: {g.avg_grade ?? "—"}</p>
                                </div>
                                <p className="text-sm text-muted-foreground">Посещаемость: {attendancePercent}% | Опоздания: {g.late_total}</p>
                            </div>
                        );
                    })}
                    </div>
                </section>
            ) : null}

            {tab === "groups" ? (
                <section className="bg-card/80 backdrop-blur-sm border border-border p-6 rounded-2xl shadow-sm grid gap-4">
                    <h2 className="text-xl font-bold">Управление группами</h2>
                    <div className="grid md:grid-cols-3 gap-3">
                        <input className="border border-border rounded-xl px-3 py-2 bg-background" placeholder="Название группы" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                        <select className="border border-border rounded-xl px-3 py-2 bg-background" value={newGroupTeacherId} onChange={(e) => setNewGroupTeacherId(e.target.value)}>
                            <option value="">Выберите преподавателя</option>
                            {teacherOptions.map((u) => (
                                <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                            ))}
                        </select>
                        <button disabled={busy} onClick={createGroup} className="rounded-xl bg-blue-600 text-white font-semibold px-3 py-2 hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"><PlusCircle className="w-4 h-4" /> Создать</button>
                    </div>
                    <div className="grid gap-3">
                    {data.groups.map((group) => {
                        const draft = groupDrafts[group.id] || { name: group.name, fk_user: String(group.fk_user) };
                        return (
                            <div key={group.id} className="border border-border/70 rounded-xl p-3 grid md:grid-cols-4 gap-3 items-center bg-gradient-to-b from-background to-background/80">
                                <input className="border border-border rounded-xl px-3 py-2 bg-background" value={draft.name} onChange={(e) => setGroupDrafts((prev) => ({ ...prev, [group.id]: { ...draft, name: e.target.value } }))} />
                                <select className="border border-border rounded-xl px-3 py-2 bg-background" value={draft.fk_user} onChange={(e) => setGroupDrafts((prev) => ({ ...prev, [group.id]: { ...draft, fk_user: e.target.value } }))}>
                                    <option value="">Выберите преподавателя</option>
                                    {teacherOptions.map((u) => (
                                        <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                                    ))}
                                </select>
                                <div className="text-sm text-muted-foreground">Текущий владелец: {group.owner_name || "—"}</div>
                                <div className="flex gap-2 justify-end">
                                    <button disabled={busy} onClick={() => saveGroup(group.id)} className="rounded-xl bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-2"><Save className="w-4 h-4" /> Сохранить</button>
                                    <button disabled={busy} onClick={() => deleteGroup(group.id)} className="rounded-xl bg-red-600 text-white px-3 py-2 hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Удалить</button>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </section>
            ) : null}

            {tab === "users" ? (
                <section className="bg-card/80 backdrop-blur-sm border border-border p-6 rounded-2xl shadow-sm grid gap-5">
                    <h2 className="text-xl font-bold">Регистрация и доступ к админке</h2>
                    <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end border border-border/70 rounded-xl p-3 bg-gradient-to-b from-background to-background/80">
                        <select className="border border-border rounded-xl px-3 py-2 bg-background" value={selectedAccessUserId} onChange={(e) => setSelectedAccessUserId(e.target.value)}>
                            <option value="">Выберите преподавателя для выдачи/отзыва доступа</option>
                            {teacherOptions.map((u) => (
                                <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                            ))}
                        </select>
                        <button
                            disabled={busy || !selectedAccessUserId}
                            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                            onClick={() => toggleAccess(Number(selectedAccessUserId))}
                        >
                            Выдать / забрать доступ
                        </button>
                    </div>
                    <div className="grid gap-2">
                        <h3 className="font-semibold">Заявки на регистрацию</h3>
                        {data.pendingRegistrations.length === 0 ? <p className="text-sm text-muted-foreground">Нет заявок</p> : null}
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
                        {data.pendingRegistrations.map((item) => (
                            <div key={item.id} className="border border-border/70 rounded-xl p-3 grid gap-3 bg-gradient-to-b from-background to-background/80">
                                <div><p>{item.full_name}</p><p className="text-sm text-muted-foreground">{item.email}</p></div>
                                <div className="flex gap-2">
                                    <button disabled={busy} className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-60 flex items-center gap-1" onClick={() => approve(item.id)}><CheckCircle2 className="w-4 h-4" /> Подтвердить</button>
                                    <button disabled={busy} className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-60" onClick={() => reject(item.id)}>Отклонить</button>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <h3 className="font-semibold">Права на админ-панель</h3>
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
                        {data.users.map((item) => (
                            <div key={item.id} className="border border-border/70 rounded-xl p-3 grid gap-3 bg-gradient-to-b from-background to-background/80">
                                <div><p>{item.full_name} {item.isRoot ? "(root)" : ""}</p><p className="text-sm text-muted-foreground">{item.email}</p></div>
                                <button disabled={busy || item.isRoot === 1} className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-60" onClick={() => toggleAccess(item.id)}>
                                    {item.canAccessAdmin ? "Забрать доступ" : "Выдать доступ"}
                                </button>
                            </div>
                        ))}
                        </div>
                    </div>
                </section>
            ) : null}

            {tab === "security" ? (
                <section className="bg-card/80 backdrop-blur-sm border border-border p-6 rounded-2xl shadow-sm grid gap-2">
                    <h2 className="text-xl font-bold">Сброс пароля по заявке</h2>
                    {data.passwordResetRequests.length === 0 ? <p className="text-sm text-muted-foreground">Нет заявок</p> : null}
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
                    {data.passwordResetRequests.map((item) => (
                        <div key={item.id} className="border border-border/70 rounded-xl p-3 grid gap-2 bg-gradient-to-b from-background to-background/80">
                            <p>{item.full_name} ({item.email})</p>
                            <p className="text-sm text-muted-foreground">Статус: {item.status}</p>
                            {item.status === "pending" ? (
                                <div className="grid sm:grid-cols-[1fr_auto] gap-2">
                                    <input className="border border-border rounded-xl px-3 py-2 bg-background" placeholder="Новый пароль" value={newPasswords[item.id] || ""} onChange={(e) => setNewPasswords((prev) => ({ ...prev, [item.id]: e.target.value }))} />
                                    <button disabled={busy} className="rounded-xl bg-purple-600 text-white px-3 py-2 hover:bg-purple-700 disabled:opacity-60" onClick={() => resolveReset(item.id)}>Сбросить пароль</button>
                                </div>
                            ) : null}
                        </div>
                    ))}
                    </div>
                </section>
            ) : null}

            {tab === "logs" ? (
                <section className="bg-card/80 backdrop-blur-sm border border-border p-6 rounded-2xl shadow-sm grid gap-2">
                    <h2 className="text-xl font-bold">Логи действий админов</h2>
                    <div className="grid gap-2">
                    {data.logs.map((log) => (
                        <div key={log.id} className="border border-border/70 rounded-xl p-3 text-sm bg-gradient-to-b from-background to-background/80">
                            [{log.created_at}] {log.actor_name || "unknown"} - {log.action} {log.details ? `(${log.details})` : ""}
                        </div>
                    ))}
                    </div>
                </section>
            ) : null}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
    return (
        <div className="bg-card/80 backdrop-blur-sm p-4 rounded-2xl border border-border/70 shadow-sm relative overflow-hidden">
            <div className="absolute -top-8 -right-8 h-16 w-16 rounded-full bg-cyan-500/10" />
            <div className="text-cyan-500 mb-2 relative">{icon}</div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-foreground relative">{value}</p>
        </div>
    );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-12 min-h-12 px-6 rounded-xl inline-flex items-center justify-center whitespace-nowrap text-sm font-normal leading-none [font-synthesis-weight:none] antialiased transition-all duration-300 ${active ? "bg-background border border-border text-cyan-500 dark:text-cyan-400" : "text-muted-foreground hover:text-foreground"}`}
        >
            {label}
        </button>
    );
}

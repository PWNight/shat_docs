"use client";

import { KeyRound, ShieldCheck, ShieldOff, SquarePen, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActionButton } from "./AdminUi";
import type { AdminOverview, AdminUser } from "@/app/admin/types";

type UsersTabProps = {
    data: AdminOverview;
    busy: boolean;
    actionKey: string | null;
    onStartEditUser: (user: AdminUser) => void;
    onRequestDeleteUser: (userId: number) => void;
    onRequestResetUser: (userId: number) => void;
    onToggleAccess: (userId: number) => void;
};

export default function UsersTab({
    data,
    busy,
    actionKey,
    onStartEditUser,
    onRequestDeleteUser,
    onRequestResetUser,
    onToggleAccess,
}: UsersTabProps) {
    return (
        <section className="grid gap-5">
            <h2 className="text-xl font-bold">Пользователи</h2>
            <div className="grid gap-2">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-4">
                    {data.users.map((item) => (
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

                                <h3 className="text-lg font-bold tracking-tight break-words">{item.full_name}</h3>
                                <p className="text-sm text-muted-foreground mb-4 break-all">{item.email}</p>

                            <div className="grid grid-cols-2 gap-2 mt-auto">
                                <Button
                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium rounded-lg text-sm transition-all"
                                    onClick={() => onStartEditUser(item)}
                                >
                                    <SquarePen className="w-4 h-4" /> Редактировать
                                </Button>

                                <ActionButton
                                    loading={actionKey === `delete-user-${item.id}`}
                                    disabled={busy || item.isRoot === 1}
                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white text-sm font-medium transition-colors disabled:opacity-60"
                                    onClick={() => onRequestDeleteUser(item.id)}
                                >
                                    <Trash2 className="w-4 h-4" /> Удалить
                                </ActionButton>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <Button
                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/80 dark:bg-zinc-800/80 hover:bg-muted dark:hover:bg-zinc-700 text-foreground text-sm font-medium transition-all"
                                    onClick={() => onRequestResetUser(item.id)}
                                >
                                    <KeyRound className="w-4 h-4" /> Сменить пароль
                                </Button>

                                <ActionButton
                                    loading={actionKey === `toggle-${item.id}`}
                                    disabled={busy || item.isRoot === 1}
                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/80 dark:bg-zinc-800/80 hover:bg-muted dark:hover:bg-zinc-700 text-foreground text-sm font-medium transition-all disabled:opacity-60"
                                    onClick={() => onToggleAccess(item.id)}
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
                    ))}
                </div>
            </div>
        </section>
    );
}

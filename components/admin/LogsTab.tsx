"use client";

import { CheckCircle2, Clock3, KeyRound, PlusCircle, Shield, ShieldCheck, ShieldOff, SquarePen, Trash2, UserCog } from "lucide-react";
import type { AdminOverview } from "@/app/admin/types";

const getStyle = (action: string) => {
    switch (action) {
        case "ADMIN_CREATE_GROUP":
            return { color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30", icon: <PlusCircle className="w-4 h-4" />, label: "Создание группы" };
        case "ADMIN_UPDATE_GROUP":
            return { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", icon: <SquarePen className="w-4 h-4" />, label: "Редактирование группы" };
        case "ADMIN_DELETE_GROUP":
            return { color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", icon: <Trash2 className="w-4 h-4" />, label: "Удаление группы" };
        case "ADMIN_UPDATE_USER":
            return { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", icon: <UserCog className="w-4 h-4" />, label: "Обновление пользователя" };
        case "ADMIN_DELETE_USER":
            return { color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", icon: <Trash2 className="w-4 h-4" />, label: "Удаление пользователя" };
        case "ADMIN_RESET_USER_PASSWORD":
        case "RESET_USER_PASSWORD":
            return { color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30", icon: <KeyRound className="w-4 h-4" />, label: "Сброс пароля" };
        case "APPROVE_REGISTRATION":
            return { color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30", icon: <CheckCircle2 className="w-4 h-4" />, label: "Подтверждение регистрации" };
        case "REJECT_REGISTRATION":
            return { color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30", icon: <ShieldOff className="w-4 h-4" />, label: "Отклонение регистрации" };
        case "ADMIN_REVOKE_SESSION":
            return { color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30", icon: <Shield className="w-4 h-4" />, label: "Отзыв сессии" };
        case "REVOKE_ADMIN_ACCESS":
            return { color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30", icon: <ShieldOff className="w-4 h-4" />, label: "Отзыв админ-доступа" };
        case "GRANT_ADMIN_ACCESS":
            return { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", icon: <ShieldCheck className="w-4 h-4" />, label: "Выдача админ-доступа" };
        default:
            return { color: "text-muted-foreground", bg: "bg-muted", icon: <Clock3 className="w-4 h-4" />, label: action };
    }
};

type LogsTabProps = {
    data: AdminOverview;
};

export default function LogsTab({ data }: LogsTabProps) {
    return (
        <section className="grid gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Логи действий админов</h2>
                <span className="text-xs text-muted-foreground">
                    Всего записей: {data.logs.length}
                </span>
            </div>

            {data.logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-10 rounded-2xl border border-dashed border-border bg-card">
                    <div className="p-3 rounded-full bg-muted mb-3">
                        <Shield className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">Нет записей в логах</p>
                    <p className="text-sm text-muted-foreground">
                        Действия администраторов будут отображаться здесь
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {data.logs.map((log) => {
                        const style = getStyle(log.action);
                        return (
                            <div
                                key={log.id}
                                className="flex gap-3 p-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all"
                            >
                                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${style.bg} ${style.color}`}>
                                    {style.icon}
                                </div>

                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium text-sm">
                                            {log.actor_name || "Система"}
                                        </p>

                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </span>
                                    </div>

                                    <p className="text-sm mt-1">
                                        <span className="font-semibold">
                                            {style.label}
                                        </span>{" "}
                                        {log.details && (
                                            <span className="text-muted-foreground">
                                                — {log.details}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

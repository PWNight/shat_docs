"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, KeyRound, PlusCircle, Shield, ShieldCheck, ShieldOff, SquarePen, Trash2, UserCog, ChevronLeft, ChevronRight } from "lucide-react";
import type { AdminOverview } from "@/app/admin/types";
import { Button } from "../ui/Button";

const getStyle = (action: string) => {
    switch (action) {
        case "ADMIN_CREATE_GROUP":
            return { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30", icon: <PlusCircle className="w-4 h-4" />, label: "Создание группы" };
        case "ADMIN_UPDATE_GROUP":
            return { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", icon: <SquarePen className="w-4 h-4" />, label: "Редактирование группы" };
        case "ADMIN_DELETE_GROUP":
            return { color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", icon: <Trash2 className="w-4 h-4" />, label: "Удаление группы" };
        case "ADMIN_UPDATE_USER":
            return { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", icon: <UserCog className="w-4 h-4" />, label: "Обновление пользователя" };
        case "ADMIN_DELETE_USER":
            return { color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", icon: <Trash2 className="w-4 h-4" />, label: "Удаление пользователя" };
        case "ADMIN_RESET_USER_PASSWORD":
        case "RESET_USER_PASSWORD":
            return { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", icon: <KeyRound className="w-4 h-4" />, label: "Сброс пароля" };
        case "APPROVE_REGISTRATION":
            return { color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", icon: <CheckCircle2 className="w-4 h-4" />, label: "Подтверждение регистрации" };
        case "REJECT_REGISTRATION":
            return { color: "text-red-500 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", icon: <ShieldOff className="w-4 h-4" />, label: "Отклонение регистрации" };
        case "ADMIN_CANCEL_PASSWORD_RESET":
            return { color: "text-red-500 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", icon: <KeyRound className="w-4 h-4" />, label: "Отмена сброса пароля" };
        case "ADMIN_REVOKE_SESSION":
            return { color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30", icon: <Shield className="w-4 h-4" />, label: "Отзыв сессии" };
        case "REVOKE_ADMIN_ACCESS":
            return { color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30", icon: <ShieldOff className="w-4 h-4" />, label: "Отзыв админ-доступа" };
        case "GRANT_ADMIN_ACCESS":
            return { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", icon: <ShieldCheck className="w-4 h-4" />, label: "Выдача админ-доступа" };
        default:
            return { color: "text-muted-foreground", bg: "bg-muted", icon: <Clock3 className="w-4 h-4" />, label: action };
    }
};

type LogsTabProps = {
    data: AdminOverview;
};

const ITEMS_PER_PAGE = 10;

export default function LogsTab({ data }: LogsTabProps) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalItems = data.logs.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedLogs = data.logs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    return (
        <section className="grid gap-4">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-bold tracking-tight">Логи действий админов</h2>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    Всего: {totalItems}
                </span>
            </div>

            {totalItems === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-10 rounded-2xl border border-dashed border-border bg-card/50">
                    <div className="p-3 rounded-full bg-muted mb-3">
                        <Shield className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">Нет записей в логах</p>
                    <p className="text-sm text-muted-foreground">
                        Действия администраторов будут отображаться здесь
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="rounded-xl shrink-0 h-9 w-9"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            <div className="flex items-center gap-1 shrink-0">
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    if (
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => goToPage(pageNum)}
                                                className="w-9 h-9 rounded-xl shrink-0"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    } else if (
                                        pageNum === currentPage - 2 ||
                                        pageNum === currentPage + 2
                                    ) {
                                        return <span key={pageNum} className="px-1 text-muted-foreground">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="rounded-xl shrink-0 h-9 w-9"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                    <div className="grid gap-3 min-h-[400px] content-start">
                        {paginatedLogs.map((log) => {
                            const style = getStyle(log.action);
                            return (
                                <div
                                    key={log.id}
                                    className="flex gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all hover:border-border/80 dark:hover:bg-zinc-900/50"
                                >
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${style.bg} ${style.color}`}>
                                        {style.icon}
                                    </div>

                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="font-bold text-sm truncate text-foreground">
                                                {log.actor_name || "Система"}
                                            </p>

                                            <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-full">
                                                {new Date(log.created_at).toLocaleString()}
                                            </span>
                                        </div>

                                        <p className="text-sm leading-relaxed">
                                            <span className="font-semibold text-foreground/90">
                                                {style.label}
                                            </span>{" "}
                                            {log.details && (
                                                <span className="text-muted-foreground inline-block">
                                                    — {log.details}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}

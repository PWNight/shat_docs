"use client";

import { useState, useMemo } from "react";
import { Clock4, Monitor, ShieldCheck, ShieldX, Ban, ChevronLeft, ChevronRight } from "lucide-react";
import { ActionButton } from "./AdminUi";
import type { AdminOverview } from "@/app/admin/types";
import type { SessionListItem } from "@/utils/session";
import { Button } from "../ui/Button";

type SessionsTabProps = {
    data: AdminOverview;
    busy: boolean;
    actionKey: string | null;
    onRevokeSession: (sessionId: string) => void;
};

const ITEMS_PER_PAGE = 12;

export default function SessionsTab({ data, busy, actionKey, onRevokeSession }: SessionsTabProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "revoked" | "expired">("all");

    const filteredSessions = useMemo(() => {
        if (filterStatus === "all") {
            return data.sessions;
        }
        return data.sessions.filter(session => session.status === filterStatus);
    }, [data.sessions, filterStatus]);

    const totalItems = filteredSessions.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedSessions = filteredSessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const getStatusStyles = (session: SessionListItem) => {
        if (session.isCurrent) {
            return { color: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", icon: <ShieldCheck className="h-3 w-3" />, label: "Текущая" };
        }
        switch (session.status) {
            case "active":
                return { color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", icon: <ShieldCheck className="h-3 w-3" />, label: "Активная" };
            case "revoked":
                return { color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", icon: <ShieldX className="h-3 w-3" />, label: "Отозвана" };
            case "expired":
                return { color: "text-gray-700 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-900/30", icon: <Clock4 className="h-3 w-3" />, label: "Истекла" };
            default:
                return { color: "text-muted-foreground", bg: "bg-muted", icon: <ShieldX className="h-3 w-3" />, label: "Неизвестно" };
        }
    };

    return (
        <section className="grid gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
                <h2 className="text-2xl font-black tracking-tight">Сессии</h2>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-border bg-muted/20 text-muted-foreground">
                    {totalItems}
                </span>
            </div>

            <div className="flex sm:justify-between flex-col sm:flex-row gap-3">
                <div className="grid grid-cols-2 sm:flex gap-2 sm:overflow-x-auto sm:pb-1 sm:scrollbar-hide -mx-1 px-1">
                    <Button
                        variant={filterStatus === "all" ? "default" : "outline"}
                        onClick={() => { setFilterStatus("all"); setCurrentPage(1); }}
                        size="sm"
                        className="w-full sm:w-auto sm:shrink-0 rounded-xl text-xs sm:text-sm px-2 sm:px-3"
                    >
                        Все ({data.sessions.length})
                    </Button>
                    <Button
                        variant={filterStatus === "active" ? "default" : "outline"}
                        onClick={() => { setFilterStatus("active"); setCurrentPage(1); }}
                        size="sm"
                        className="w-full sm:w-auto sm:shrink-0 rounded-xl text-xs sm:text-sm px-2 sm:px-3"
                    >
                        Активные ({data.sessions.filter(s => s.status === "active").length})
                    </Button>
                    <Button
                        variant={filterStatus === "revoked" ? "default" : "outline"}
                        onClick={() => { setFilterStatus("revoked"); setCurrentPage(1); }}
                        size="sm"
                        className="w-full sm:w-auto sm:shrink-0 rounded-xl text-xs sm:text-sm px-2 sm:px-3"
                    >
                        Отозваны ({data.sessions.filter(s => s.status === "revoked").length})
                    </Button>
                    <Button
                        variant={filterStatus === "expired" ? "default" : "outline"}
                        onClick={() => { setFilterStatus("expired"); setCurrentPage(1); }}
                        size="sm"
                        className="w-full sm:w-auto sm:shrink-0 rounded-xl text-xs sm:text-sm px-2 sm:px-3"
                    >
                        Истекли ({data.sessions.filter(s => s.status === "expired").length})
                    </Button>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
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
            </div>

            {totalItems === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-10 rounded-2xl border border-dashed border-border bg-background/60 min-h-[300px]">
                    <div className="p-3 rounded-full bg-muted mb-3">
                        <Ban className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">Нет сессий для отображения</p>
                    <p className="text-sm text-muted-foreground">
                        Проверьте выбранный фильтр или попробуйте позже
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 content-start">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {paginatedSessions.map((item) => {
                            const statusStyles = getStatusStyles(item);
                            return (
                                <div key={item.sessionId} className="overflow-hidden rounded-2xl border border-border/70 bg-background p-4 sm:p-5 shadow-sm transition-colors duration-200 hover:border-border/80 dark:hover:bg-zinc-900/50">
                                    <div className="mb-3 sm:mb-0 sm:absolute sm:right-4 sm:top-4">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusStyles.bg} ${statusStyles.color}`}>
                                            {statusStyles.icon}
                                            {statusStyles.label}
                                        </span>
                                    </div>
                                    <div className="mb-4 grid gap-1 sm:pr-16">
                                        <p className="font-bold leading-tight break-words text-foreground">{item.fullName}</p>
                                        <p className="text-xs text-muted-foreground break-all">{item.email}</p>
                                    </div>
                                    <div className="grid gap-2.5 rounded-xl border border-border/50 bg-muted/40 p-3.5 mb-4">
                                        <p className="text-xs font-medium flex items-center gap-2 text-foreground/80">
                                            <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                                            {item.deviceLabel}
                                        </p>
                                        <div className="space-y-1">
                                            <p className="text-[11px] text-muted-foreground font-mono break-all">IP: {item.ipAddress || "Неизвестен"}</p>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed break-words">
                                                UA: <span className="opacity-70">{item.userAgent || "—"}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid gap-1.5 mb-4 px-1">
                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                            <Clock4 className="h-3 w-3 opacity-70" />
                                            <span>Создана: {new Date(item.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                            <div className="h-3 w-3" />
                                            <span>Активность: {new Date(item.lastSeenAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <ActionButton
                                        loading={actionKey === `revoke-session-${item.sessionId}`}
                                        disabled={busy || item.isCurrent || item.status !== "active"}
                                        className="w-full rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-50 disabled:grayscale-[0.5]"
                                        onClick={() => onRevokeSession(item.sessionId)}
                                    >
                                        {item.isCurrent ? "Текущая сессия" : item.status !== "active" ? "Неактивна" : "Отозвать доступ"}
                                    </ActionButton>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}

"use client";

import { Ban, CheckCircle2, Clock3, KeyRound, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ActionButton } from "./AdminUi";
import PaginationControls from "@/components/ui/PaginationControls";
import type { AdminOverview } from "@/app/admin/types";

type RequestsTabProps = {
    data: AdminOverview;
    busy: boolean;
    actionKey: string | null;
    onApprove: (userId: number) => void;
    onReject: (userId: number) => void;
    onOpenResetDialog: (requestId: number) => void;
    onCancelReset: (requestId: number) => void;
};

export default function RequestsTab({
    data,
    busy,
    actionKey,
    onApprove,
    onReject,
    onOpenResetDialog,
    onCancelReset,
}: RequestsTabProps) {
    const ITEMS_PER_PAGE = 9;
    const [registrationPage, setRegistrationPage] = useState(1);
    const [resetPage, setResetPage] = useState(1);

    const totalRegistrationItems = data.pendingRegistrations.length;
    const totalResetItems = data.passwordResetRequests.length;

    const paginatedRegistrations = useMemo(() => {
        const start = (registrationPage - 1) * ITEMS_PER_PAGE;
        return data.pendingRegistrations.slice(start, start + ITEMS_PER_PAGE);
    }, [data.pendingRegistrations, registrationPage]);

    const paginatedResets = useMemo(() => {
        const start = (resetPage - 1) * ITEMS_PER_PAGE;
        return data.passwordResetRequests.slice(start, start + ITEMS_PER_PAGE);
    }, [data.passwordResetRequests, resetPage]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(totalRegistrationItems / ITEMS_PER_PAGE));
        if (registrationPage > totalPages) setRegistrationPage(totalPages);
    }, [registrationPage, totalRegistrationItems]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(totalResetItems / ITEMS_PER_PAGE));
        if (resetPage > totalPages) setResetPage(totalPages);
    }, [resetPage, totalResetItems]);

    return (
        <section className="grid gap-6">
            <div className="grid gap-3">
                <div className="flex items-end justify-between gap-3">
                    <h2 className="text-2xl font-black tracking-tight">Заявки на регистрацию</h2>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-border bg-muted/20 text-muted-foreground">
                        {totalRegistrationItems}
                    </span>
                </div>

                {data.pendingRegistrations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-border bg-background">
                        <div className="p-3 rounded-full bg-muted mb-3">
                            <Users className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium">Нет новых заявок</p>
                        <p className="text-sm text-muted-foreground">
                            Все пользователи уже обработаны
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {paginatedRegistrations.map((item) => (
                            <div
                                key={item.id}
                                className="group relative overflow-hidden p-4 rounded-2xl border border-border/70 bg-background shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm"
                            >
                                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none bg-gradient-to-br from-blue-500/5 to-transparent" />
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                        <Clock3 className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-muted border">
                                        ID: {item.id}
                                    </span>
                                </div>

                                <h4 className="font-bold break-words">{item.full_name}</h4>
                                <p className="text-sm text-muted-foreground mb-4 break-all">{item.email}</p>

                                <div className="flex gap-2">
                                    <ActionButton
                                        loading={actionKey === `approve-${item.id}`}
                                        disabled={busy}
                                        className="flex-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm py-2"
                                        onClick={() => onApprove(item.id)}
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Принять
                                    </ActionButton>

                                    <ActionButton
                                        loading={actionKey === `reject-${item.id}`}
                                        disabled={busy}
                                        className="flex-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm py-2"
                                        onClick={() => onReject(item.id)}
                                    >
                                        Отклонить
                                    </ActionButton>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <PaginationControls
                    currentPage={registrationPage}
                    totalItems={totalRegistrationItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setRegistrationPage}
                />
            </div>

            <div className="grid gap-3">
                <div className="flex items-end justify-between gap-3">
                    <h2 className="text-2xl font-black tracking-tight">Заявки на сброс пароля</h2>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-border bg-muted/20 text-muted-foreground">
                        {totalResetItems}
                    </span>
                </div>

                {data.passwordResetRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-border bg-background">
                        <div className="p-3 rounded-full bg-muted mb-3">
                            <KeyRound className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium">Нет заявок на сброс</p>
                        <p className="text-sm text-muted-foreground">
                            Пользователи не запрашивали смену пароля
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {paginatedResets.map((item) => (
                            <div
                                key={item.id}
                                className="group relative overflow-hidden p-4 rounded-2xl border border-border/70 bg-background shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm"
                            >
                                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none bg-gradient-to-br from-blue-500/5 to-transparent" />
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                        <KeyRound className="w-5 h-5" />
                                    </div>

                                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-muted border">
                                        ID: {item.id}
                                    </span>
                                </div>

                                <h4 className="font-bold break-words">{item.full_name}</h4>
                                <p className="text-sm text-muted-foreground break-all">{item.email}</p>

                                <p className="text-xs mt-2 mb-4">
                                    Статус:{" "}
                                    <span
                                        className={`font-semibold ${
                                            item.status === "pending"
                                                ? "text-amber-500"
                                                : item.status === "cancelled"
                                                    ? "text-red-500"
                                                    : "text-green-500"
                                        }`}
                                    >
                                        {item.status}
                                    </span>
                                </p>

                                {item.status === "pending" && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <Button
                                            className="w-full rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm"
                                            onClick={() => onOpenResetDialog(item.id)}
                                        >
                                            Обработать заявку
                                        </Button>
                                        <ActionButton
                                            loading={actionKey === `cancel-reset-${item.id}`}
                                            disabled={busy}
                                            className="w-full rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white text-sm"
                                            onClick={() => onCancelReset(item.id)}
                                        >
                                            <Ban className="w-4 h-4" /> Отменить
                                        </ActionButton>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                <PaginationControls
                    currentPage={resetPage}
                    totalItems={totalResetItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setResetPage}
                />
            </div>
        </section>
    );
}

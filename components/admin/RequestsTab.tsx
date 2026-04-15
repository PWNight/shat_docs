"use client";

import { CheckCircle2, Clock3, KeyRound, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActionButton } from "./AdminUi";
import type { AdminOverview } from "@/app/admin/types";

type RequestsTabProps = {
    data: AdminOverview;
    busy: boolean;
    actionKey: string | null;
    onApprove: (userId: number) => void;
    onReject: (userId: number) => void;
    onOpenResetDialog: (requestId: number) => void;
};

export default function RequestsTab({
    data,
    busy,
    actionKey,
    onApprove,
    onReject,
    onOpenResetDialog,
}: RequestsTabProps) {
    return (
        <section className="grid gap-6">
            <div className="grid gap-3">
                <h2 className="text-xl font-bold">Заявки на регистрацию</h2>

                {data.pendingRegistrations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-border bg-card">
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
                        {data.pendingRegistrations.map((item) => (
                            <div
                                key={item.id}
                                className="relative p-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                                        <Clock3 className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-muted border">
                                        ID: {item.id}
                                    </span>
                                </div>

                                <h4 className="font-bold">{item.full_name}</h4>
                                <p className="text-sm text-muted-foreground mb-4">{item.email}</p>

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
            </div>

            <div className="grid gap-3">
                <h2 className="text-xl font-bold">Заявки на сброс пароля</h2>

                {data.passwordResetRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-border bg-card">
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
                        {data.passwordResetRequests.map((item) => (
                            <div
                                key={item.id}
                                className="relative p-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                        <KeyRound className="w-5 h-5" />
                                    </div>

                                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-muted border">
                                        ID: {item.id}
                                    </span>
                                </div>

                                <h4 className="font-bold">{item.full_name}</h4>
                                <p className="text-sm text-muted-foreground">{item.email}</p>

                                <p className="text-xs mt-2 mb-4">
                                    Статус:{" "}
                                    <span
                                        className={`font-semibold ${
                                            item.status === "pending"
                                                ? "text-amber-500"
                                                : "text-green-500"
                                        }`}
                                    >
                                        {item.status}
                                    </span>
                                </p>

                                {item.status === "pending" && (
                                    <Button
                                        className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                                        onClick={() => onOpenResetDialog(item.id)}
                                    >
                                        Обработать заявку
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

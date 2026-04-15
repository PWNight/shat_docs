"use client";

import { Clock4, Monitor, ShieldCheck, ShieldX } from "lucide-react";
import { ActionButton } from "./AdminUi";
import type { AdminOverview } from "@/app/admin/types";

type SessionsTabProps = {
    data: AdminOverview;
    busy: boolean;
    actionKey: string | null;
    onRevokeSession: (sessionId: string) => void;
};

export default function SessionsTab({ data, busy, actionKey, onRevokeSession }: SessionsTabProps) {
    return (
        <section className="grid gap-4">
            <h2 className="text-xl font-bold">Текущие сессии приложения</h2>
            {data.sessions.length === 0 ? <p className="text-sm text-muted-foreground">Нет активных сессий</p> : null}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-3">
                {data.sessions.map((item) => (
                    <div key={item.sessionId} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute right-4 top-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                                item.isCurrent
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-muted text-muted-foreground"
                            }`}>
                                {item.isCurrent ? <ShieldCheck className="h-3 w-3" /> : <ShieldX className="h-3 w-3" />}
                                {item.isCurrent ? "Текущая" : "Активная"}
                            </span>
                        </div>
                        <div className="mb-3 grid gap-1 pr-16">
                            <p className="font-semibold leading-tight">{item.fullName}</p>
                            <p className="text-sm text-muted-foreground">{item.email}</p>
                        </div>
                        <div className="grid gap-2 rounded-xl border border-border/60 bg-muted/30 p-3">
                            <p className="text-xs flex items-center gap-2"><Monitor className="h-3.5 w-3.5 text-muted-foreground" />{item.deviceLabel}</p>
                            <p className="text-xs text-muted-foreground">IP: {item.ipAddress || "IP неизвестен"}</p>
                            <p className="text-xs text-muted-foreground">UA: {item.userAgent || "Браузер не определен"}</p>
                        </div>
                        <div className="mt-3 grid gap-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock4 className="h-3.5 w-3.5" />Создана: {new Date(item.createdAt).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Последняя активность: {new Date(item.lastSeenAt).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Истекает: {new Date(item.expiresAt).toLocaleString()}</p>
                        </div>
                        <ActionButton
                            loading={actionKey === `revoke-session-${item.sessionId}`}
                            disabled={busy || item.isCurrent}
                            className="mt-3 w-full rounded-lg bg-red-50 dark:bg-zinc-700/50 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60"
                            onClick={() => onRevokeSession(item.sessionId)}
                        >
                            {item.isCurrent ? "Текущую сессию нельзя отозвать" : "Отозвать сессию"}
                        </ActionButton>
                    </div>
                ))}
            </div>
        </section>
    );
}

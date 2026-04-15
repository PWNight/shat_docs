"use client";

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
                    <div key={item.sessionId} className="border border-border rounded-xl p-3 grid gap-2 bg-card">
                        <p className="font-medium">{item.fullName} ({item.email})</p>
                        <p className="text-sm text-muted-foreground">{item.deviceLabel} • {item.ipAddress || "IP неизвестен"}</p>
                        <p className="text-xs text-muted-foreground">Создана: {new Date(item.createdAt).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Последняя активность: {new Date(item.lastSeenAt).toLocaleString()}</p>
                        <ActionButton
                            loading={actionKey === `revoke-session-${item.sessionId}`}
                            disabled={busy}
                            className="rounded-lg bg-red-50 dark:bg-zinc-700/50 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60"
                            onClick={() => onRevokeSession(item.sessionId)}
                        >
                            Отозвать сессию
                        </ActionButton>
                    </div>
                ))}
            </div>
        </section>
    );
}

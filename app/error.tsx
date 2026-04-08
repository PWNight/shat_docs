"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { logger } from "@/utils/logger";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        logger.error("Unhandled UI error", {
            message: error.message,
            digest: error.digest,
        });
    }, [error]);

    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <h2 className="text-2xl font-bold">Что-то пошло не так</h2>
            <p className="max-w-md text-muted-foreground">
                {isDbOfflineError(error)
                    ? "Нет подключения к базе данных. Проверьте доступность БД и повторите попытку."
                    : "Во время загрузки страницы произошла ошибка. Попробуйте обновить страницу или вернуться на главную."}
            </p>
            <div className="flex gap-3">
                <button
                    onClick={reset}
                    className="rounded-xl bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                >
                    Повторить
                </button>
                <Link
                    href="/"
                    className="rounded-xl border px-4 py-2 hover:bg-muted"
                >
                    На главную
                </Link>
            </div>
        </div>
    );
}

function isDbOfflineError(error: Error): boolean {
    const msg = (error?.message ?? "").toLowerCase();
    return (
        msg.includes("etimedout") ||
        msg.includes("econnrefused") ||
        msg.includes("enotfound") ||
        msg.includes("connect") && msg.includes("timeout") ||
        msg.includes("pool") && msg.includes("connect") ||
        msg.includes("mysql")
    );
}

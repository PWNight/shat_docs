"use client";

import Link from "next/link";
import { Bug, CircleHelp, LifeBuoy, Mail, MessageSquareWarning } from "lucide-react";

const SUPPORT_EMAIL = "support@shat-docs.local";
const TELEGRAM_URL = "https://t.me/PWNight";
const GITHUB_ISSUES_URL = "https://github.com/PWNight/shat_docs/issues";

export default function SupportPage() {
    return (
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8 md:py-12">
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-500">
                    <LifeBuoy className="h-4 w-4" />
                    Поддержка
                </div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Центр поддержки</h1>
                <p className="mt-3 max-w-3xl text-sm text-muted-foreground md:text-base">
                    Если что-то не работает или появились вопросы по системе, выберите удобный канал связи.
                    Чем подробнее описание проблемы, тем быстрее получится помочь.
                </p>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="rounded-2xl border bg-card p-5 transition-colors hover:border-blue-500/40 hover:bg-card/80"
                >
                    <Mail className="mb-3 h-5 w-5 text-blue-500" />
                    <h2 className="text-lg font-semibold">Email</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{SUPPORT_EMAIL}</p>
                </a>

                <a
                    href={TELEGRAM_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border bg-card p-5 transition-colors hover:border-blue-500/40 hover:bg-card/80"
                >
                    <CircleHelp className="mb-3 h-5 w-5 text-blue-500" />
                    <h2 className="text-lg font-semibold">Telegram</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Быстрые вопросы и обратная связь</p>
                </a>

                <a
                    href={GITHUB_ISSUES_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border bg-card p-5 transition-colors hover:border-blue-500/40 hover:bg-card/80"
                >
                    <Bug className="mb-3 h-5 w-5 text-blue-500" />
                    <h2 className="text-lg font-semibold">GitHub Issues</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Для баг-репортов и предложений</p>
                </a>
            </section>

            <section className="rounded-2xl border bg-card p-6">
                <div className="mb-3 flex items-center gap-2 text-blue-500">
                    <MessageSquareWarning className="h-5 w-5" />
                    <h2 className="text-xl font-semibold text-foreground">Что приложить к обращению</h2>
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>шаги, после которых появилась ошибка;</li>
                    <li>скриншот или текст ошибки из консоли/интерфейса;</li>
                    <li>страница и действие, где воспроизводится проблема.</li>
                </ul>
                <div className="mt-5">
                    <Link
                        href="/"
                        className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                        Вернуться на главную
                    </Link>
                </div>
            </section>
        </div>
    );
}

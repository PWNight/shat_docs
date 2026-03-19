"use client";
import Link from "next/link";
import { buttonVariants } from "./ui/Button";
import React, { useState } from "react";
import Image from "next/image";
import { LifeBuoy, Info, Loader2, Calendar, Tag, ChevronRight } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/Dialog";

interface GitHubRelease {
    id: number;
    tag_name: string;
    published_at: string;
    body: string;
    formattedBody?: string;
}

export function FooterButtons() {
    return (
        <div className="flex items-center gap-2">
            <Link
                href="/support"
                className={buttonVariants({
                    size: "icon",
                    className: "h-9 w-9 rounded-full bg-muted dark:bg-zinc-600 transition-all duration-200",
                })}
            >
                <LifeBuoy className="h-5 w-5 dark:text-white" />
            </Link>
            <Link
                href="https://github.com/PWNight/shat_docs"
                target="_blank"
                className={buttonVariants({
                    size: "icon",
                    className: "h-9 w-9 rounded-full bg-muted dark:bg-zinc-600 transition-all duration-200",
                })}
            >
                <svg className={"w-5 h-5 fill-white"} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <title>GitHub</title>
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
            </Link>
        </div>
    );
}

export function Footer() {
    const appVersion = process.env.APP_VERSION || "1.0.0";

    const [releases, setReleases] = useState<GitHubRelease[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchChangelog = async () => {
        if (releases.length > 0) return;
        setIsLoading(true);
        try {
            const res = await fetch(`https://api.github.com/repos/PWNight/shat_docs/releases?per_page=10`);
            const data: GitHubRelease[] = await res.json();

            const formattedReleases = data.map((rel) => ({
                ...rel,
                formattedBody: rel.body
                    ? rel.body
                        .replace(/^### (.*$)/gim, '<h3 class="font-bold text-lg mt-4 mb-2 flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>$1</h3>')
                        .replace(/^## (.*$)/gim, '<h2 class="font-bold text-xl mt-4 mb-2 border-l-4 border-blue-500 pl-3">$1</h2>')
                        .replace(/^# (.*$)/gim, '<h1 class="font-bold text-2xl mt-4 mb-2">$1</h1>')
                        .replace(/^\* (.*$)/gim, '<li class="ml-6 list-none flex items-start gap-2 mb-1"><span class="mt-1.5 text-blue-500"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span><span>$1</span></li>')
                        .replace(/^- (.*$)/gim, '<li class="ml-6 list-none flex items-start gap-2 mb-1"><span class="mt-1.5 text-blue-500"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span><span>$1</span></li>')
                        .replace(/\*\*(.*)\*\*/gim, '<strong class="text-blue-600 dark:text-blue-400">$1</strong>')
                    : "Описание изменений отсутствует.",
            }));

            setReleases(formattedReleases);
        } catch (e) {
            console.error("Failed to fetch releases:", e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <footer className="w-full py-2 px-4 lg:px-10 border-t bg-muted/10 flex flex-row justify-between gap-4 items-center">
            <div className="flex items-center gap-3">
                <Image
                    src="/logo.png"
                    alt="SHAT Logo"
                    width={36}
                    height={36}
                    quality={100}
                    className="shrink-0 transition-transform hover:scale-105"
                />
                <div className="flex flex-col gap-1">
                    <p className="text-sm opacity-90 font-medium">SHAT Docs © 2025-{new Date().getFullYear()}</p>
                    <div className="flex items-center gap-1">
                        <Dialog onOpenChange={(open) => open && fetchChangelog()}>
                            <DialogTrigger asChild>
                                <button className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-500 hover:text-blue-600 hover:underline transition-all">
                                    <Info size={12} />
                                    v{appVersion} (история изменений)
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] sm:max-w-xl bg-card border-border shadow-2xl rounded-2xl p-0 overflow-hidden">
                                <DialogHeader className="p-6 pb-4 bg-muted/30 border-b">
                                    <DialogTitle className="text-2xl flex items-center gap-2 tracking-tight">
                                        <ChevronRight className="text-blue-500" />
                                        Последние обновления
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center py-20 gap-4">
                                            <div className="relative">
                                                <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
                                                <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse"></div>
                                            </div>
                                            <p className="text-sm font-medium text-muted-foreground animate-pulse">Получаем данные с GitHub...</p>
                                        </div>
                                    ) : releases.length > 0 ? (
                                        <div className="relative ml-2 space-y-10 border-l-2 border-muted pb-2">
                                            {releases.map((rel) => (
                                                <div key={rel.id} className="relative pl-8 group">
                                                    <div className="absolute -left-2.25 top-1 w-4 h-4 rounded-full bg-card border-2 border-muted group-hover:border-blue-500 transition-colors z-10" />

                                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                                        <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                            <Tag size={12} />
                                                            {rel.tag_name}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                                                            <Calendar size={12} />
                                                            {new Date(rel.published_at).toLocaleDateString('ru-RU', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div
                                                        className="text-sm leading-relaxed text-foreground/80 space-y-2 prose prose-sm dark:prose-invert max-w-none"
                                                        dangerouslySetInnerHTML={{ __html: rel.formattedBody || "" }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Не удалось загрузить данные. Попробуйте позже.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-muted/20 border-t flex justify-end">
                                    <Link href={"https://github.com/PWNight/shat_docs"} className="text-[10px] text-muted-foreground hover:text-muted-foreground/80 uppercase tracking-widest font-bold">
                                        Github репозиторий проекта
                                    </Link>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
            <FooterButtons />
        </footer>
    );
}
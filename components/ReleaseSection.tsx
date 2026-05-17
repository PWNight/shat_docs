"use client";

import React from "react";
import { sanitizeHtml } from "@/utils/sanitize-html";
import { Sparkles, Calendar, Info } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/Dialog";

interface GitHubRelease {
    id: number;
    name: string;
    published_at: string;
    body: string;
    formattedBody?: string;
}

interface ReleaseSectionProps {
    release: GitHubRelease | null;
    description: string;
    badgeText: string;
    icon: React.ReactNode;
    variant: "major" | "beta" | "patch";
    error?: string | null;
}

export default function ReleaseSection({ release, description, badgeText, icon, variant, error }: ReleaseSectionProps) {
    const isMajor = variant === "major";
    const isBeta = variant === "beta";
    const isPatch = variant === "patch";

    const getBorderClass = () => {
        if (isMajor) return "border-blue-500/20 hover:border-blue-500/40";
        if (isBeta) return "border-blue-500/30 hover:border-blue-500/50";
        return "border-border hover:border-foreground/10";
    };

    const getBadgeClass = () => {
        if (isMajor || isBeta) return "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400";
        return "bg-muted border-border text-muted-foreground";
    };

    const getButtonClass = () => {
        if (isMajor) return "bg-blue-500 text-white hover:bg-blue-600";
        if (isBeta) return "bg-blue-500 text-white hover:bg-blue-600";
        return "bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 hover:bg-neutral-200 border border-border text-foreground";
    };

    return (
        <section className={`relative overflow-hidden rounded-3xl border ${getBorderClass()} bg-card/30 backdrop-blur-2xl p-6 md:p-8 shadow-xl flex-1 transition-all duration-300 group flex flex-col justify-between min-h-55`}>
            {isMajor && <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 via-transparent to-transparent opacity-100" />}
            
            <div className="absolute top-0 right-0 p-0 opacity-15 pointer-events-none translate-x-1/4 -translate-y-1/4 rotate-12">
                {isMajor && <Sparkles size={320} className="text-blue-500" strokeWidth={0.5} />}
            </div>
            
            {isBeta && (
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                    <div className="text-blue-500" style={{ fontSize: '100px' }}>{icon}</div>
                </div>
            )}
            
            {isPatch && (
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform">
                    <div className="text-foreground" style={{ fontSize: '100px' }}>{icon}</div>
                </div>
            )}

            <div className="relative z-10 flex flex-col h-full justify-between">
                {release ? (
                    <div className="flex flex-col h-full gap-6">
                        <div className="space-y-4">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getBadgeClass()} border w-fit`}>
                                <span className={`text-sm ${isMajor || isBeta ? "animate-pulse shrink-0" : ""}`}>{icon}</span>
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">{badgeText}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <h2 className={`${isMajor ? "text-4xl md:text-6xl" : "text-2xl md:text-3xl"} font-black tracking-tight leading-none ${isMajor ? "bg-linear-to-r from-foreground via-foreground/90 to-blue-500 bg-clip-text text-transparent wrap-break-word" : isBeta ? "text-foreground/90" : "text-foreground/80"}`}>
                                    {release.name}
                                </h2>
                                <span className="flex items-center gap-1.5 text-sm md:text-base text-muted-foreground">
                                    <Calendar size={isMajor ? 16 : 15} className={isMajor || isBeta ? "text-blue-500" : "text-muted-foreground"} />
                                    {new Date(release.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-base md:text-lg max-w-sm leading-relaxed font-medium">
                            {description}
                        </p>
                        <div className="pt-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className={`group/btn relative inline-flex items-center justify-center gap-3 px-8 py-4 w-full sm:w-fit rounded-2xl ${getButtonClass()} text-sm font-bold transition-all shadow-xl active:scale-95 ${isMajor ? "" : "px-6 py-2.5 shadow-lg"}`}>
                                        {isMajor && <Info size={20} />}
                                        {isMajor ? "Посмотреть изменения" : "Посмотреть изменения"}
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[95vw] sm:max-w-xl bg-card/95 backdrop-blur-3xl border-border shadow-2xl rounded-4xl p-0 overflow-hidden">
                                    <div>
                                        <DialogHeader className={`p-6 ${isMajor || isBeta ? "bg-blue-500/5 border-b border-blue-500/10" : "bg-muted/30 border-b"}`}>
                                            <DialogTitle className="text-xl flex items-center gap-3 font-bold">
                                                <span className={`text-2xl ${(isMajor || isBeta) ? "text-blue-500 shrink-0" : "text-muted-foreground shrink-0"}`}>{icon}</span>
                                                <span>{isMajor ? `Обновление ${release.name}` : isBeta ? `Бета ${release.name}` : `Патч ${release.name}`}</span>
                                            </DialogTitle>
                                        </DialogHeader>
                                        <div
                                            className="overflow-y-auto px-6 pb-4 max-h-[60vh] custom-scrollbar prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(release.formattedBody || "") }}
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 h-full py-20 text-center">
                        {error ? (
                            <div>
                                <p className="text-sm font-bold">Нет подключения к интернету</p>
                                <p className="text-sm text-muted-foreground mt-1">{isBeta ? "Бета-изменения недоступны." : "Патч-изменения недоступны."}</p>
                            </div>
                        ) : (
                            <div className="opacity-40">
                                {isMajor && <Sparkles size={48} className="mb-4 mx-auto" />}
                                <h3 className="text-2xl font-bold">{isMajor ? "Готовим мажорный релиз" : isBeta ? "Новая бета скоро..." : "Новый патч скоро..."}</h3>
                                <p className="text-sm text-muted-foreground mt-2">{isMajor ? "Скоро появится описание изменений." : "Когда выйдет новая версия — она появится здесь."}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

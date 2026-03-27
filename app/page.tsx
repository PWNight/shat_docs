"use client";

import {
    LayoutDashboard,
    FileText,
    ArrowRight,
    Boxes,
    Sparkles,
    Calendar,
    Info,
    ChevronRight,
    Tag,
    Loader2,
    Bug
} from "lucide-react";
import Link from "next/link";
import React, {useEffect, useState} from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/Dialog";

interface GitHubRelease {
    id: number;
    tag_name: string;
    published_at: string;
    body: string;
    formattedBody?: string;
}

export interface FeatureCard {
    title: string;
    desc: string;
    icon: React.ReactElement<{
        size?: number | string;
        strokeWidth?: number;
    }>;
    href: string;
}

const FeatureCard = ({ title, desc, icon, href }: FeatureCard) => (
    <Link href={href} className="group p-6 bg-card border rounded-xl hover:border-blue-500 transition-all shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-blue-400 dark:text-blue-500">
                {React.cloneElement(icon, { size: 24 })}
            </div>
            <ArrowRight size={18} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2">{desc}</p>
    </Link>
);

export default function MainPage() {
    const [latestMajor, setLatestMajor] = useState<GitHubRelease | null>(null);
    const [latestPatch, setLatestPatch] = useState<GitHubRelease | null>(null);
    const [loading, setLoading] = useState(true);

    const isMajorRelease = (tagName: string) => {
        const version = tagName.replace(/[^0-9.]/g, '');
        return version.endsWith('.0');
    };

    const formatReleaseBody = (body: string) => {
        if (!body) return "Описание изменений отсутствует.";
        return body
            .replace(/^### (.*$)/gim, '<h3 class="font-bold text-lg mt-4 mb-2 flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="font-bold text-xl mt-4 mb-2 border-l-4 border-blue-500 pl-3">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="font-bold text-2xl mt-4 mb-2">$1</h1>')
            .replace(/^\* (.*$)/gim, '<li class="ml-6 list-none flex items-start gap-2 mb-1"><span class="mt-1.5 text-blue-500"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span><span>$1</span></li>')
            .replace(/^- (.*$)/gim, '<li class="ml-6 list-none flex items-start gap-2 mb-1"><span class="mt-1.5 text-blue-500"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span><span>$1</span></li>')
            .replace(/\*\*(.*)\*\*/gim, '<strong class="text-blue-600 dark:text-blue-400">$1</strong>');
    };

    useEffect(() => {
        const fetchReleases = async () => {
            try {
                const res = await fetch(`https://api.github.com/repos/PWNight/shat_docs/releases`);
                const data: GitHubRelease[] = await res.json();

                // Находим мажорный релиз
                const major = data.find(rel => isMajorRelease(rel.tag_name));
                // Находим последний патч (самый свежий релиз, который НЕ мажорный)
                const patch = data.find(rel => !isMajorRelease(rel.tag_name));

                if (major) {
                    setLatestMajor({ ...major, formattedBody: formatReleaseBody(major.body) });
                }
                if (patch) {
                    setLatestPatch({ ...patch, formattedBody: formatReleaseBody(patch.body) });
                }
            } catch (e) {
                console.error("Failed to fetch releases:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchReleases();
    }, []);

    return (
        <div className="flex flex-col flex-1 p-6 max-w-6xl mx-auto w-full gap-8 md:gap-12 pb-20">
            <section>
                <h1 className="text-4xl font-bold tracking-tight mb-4">SHAT Docs</h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                    Система управления группами и документацией.
                    <br/>Все учебные процессы в одном интерфейсе.
                </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FeatureCard
                    title="Личный кабинет"
                    desc="Интуитивно понятная панель управления аккаунтом."
                    icon={<LayoutDashboard/>}
                    href="/profile"
                />
                <FeatureCard
                    title="Группы"
                    desc="Учёт успеваемости, посещаемости и списка студентов."
                    icon={<Boxes/>}
                    href="/profile/groups"
                />
                <FeatureCard
                    title="Документация"
                    desc="Инструкции и рекомендации по использованию приложения."
                    icon={<FileText/>}
                    href="/wiki"
                />
            </div>

            <div className="flex flex-col gap-6">
                {/* Блок Мажорного Релиза (без изменений) */}
                {!loading && latestMajor && (
                    <section className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 md:p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden sm:block">
                            <Sparkles size={80} className="text-blue-500" />
                        </div>

                        <div className="relative z-10 flex flex-col gap-5 md:gap-6">
                            <div>
                                <div className="flex items-center gap-2 text-blue-500 mb-2">
                                    <Sparkles size={16} className="animate-pulse" />
                                    <span className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                        Последнее крупное обновление
                                    </span>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                                        {latestMajor.tag_name}
                                    </h2>
                                    <span className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground font-medium">
                                        <Calendar size={13} />
                                        {new Date(latestMajor.published_at).toLocaleDateString('ru-RU', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 w-full sm:w-fit rounded-xl sm:rounded-full bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-lg">
                                        <Info size={16} />
                                        Посмотреть изменения
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[95vw] sm:max-w-xl bg-card border-border shadow-2xl rounded-2xl p-0 overflow-hidden">
                                    <DialogHeader className="p-4 bg-muted/30 border-b">
                                        <DialogTitle className="text-xl md:text-2xl flex items-center gap-2 tracking-tight">
                                            <ChevronRight className="text-blue-500 shrink-0" />
                                            Обновление {latestMajor.tag_name}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="px-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                        <div
                                            className="text-sm leading-relaxed space-y-2 prose prose-sm dark:prose-invert max-w-none
                                               prose-headings:font-bold prose-headings:tracking-tight
                                               prose-h1:text-xl prose-h2:text-lg prose-h3:text-base"
                                            dangerouslySetInnerHTML={{ __html: latestMajor.formattedBody || "" }}
                                        />
                                    </div>
                                    <div className="p-4 bg-muted/20 border-t flex justify-end">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                            SHAT Docs {latestMajor.tag_name}
                                        </span>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </section>
                )}

                {!loading && latestPatch && latestPatch.id !== latestMajor?.id && (
                    <section className="relative overflow-hidden rounded-2xl border border-border bg-muted/10 p-5 md:p-6 animate-in fade-in slide-in-from-bottom-3 duration-600">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden sm:block">
                            <Bug size={80} className="text-blue-500" />
                        </div>
                        <div className="relative z-10 flex flex-col gap-5 md:gap-6">
                            <div>
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <Bug size={15} />
                                    <span className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-foreground/70">
                                        Последний патч обновления
                                    </span>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground/90">
                                        {latestPatch.tag_name}
                                    </h2>
                                    <span className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground font-medium">
                                        <Calendar size={13} />
                                        {new Date(latestPatch.published_at).toLocaleDateString('ru-RU', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 w-full sm:w-fit rounded-xl sm:rounded-full bg-muted border border-input text-foreground text-sm font-semibold hover:bg-muted/80 transition-colors">
                                        <Info size={16} />
                                        Посмотреть изменения
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[95vw] sm:max-w-xl bg-card border-border shadow-2xl rounded-2xl p-0 overflow-hidden">
                                    <DialogHeader className="p-4 bg-muted/30 border-b">
                                        <DialogTitle className="text-xl md:text-2xl flex items-center gap-2 tracking-tight">
                                            <Tag className="text-muted-foreground shrink-0" size={18} />
                                            Патч {latestPatch.tag_name}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="px-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                        <div
                                            className="text-sm leading-relaxed space-y-2 prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: latestPatch.formattedBody || "" }}
                                        />
                                    </div>
                                    <div className="p-4 bg-muted/20 border-t flex justify-end">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                            SHAT Docs {latestPatch.tag_name}
                                        </span>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </section>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="animate-spin text-blue-500" size={24} />
                    </div>
                )}
            </div>
        </div>
    );
}
"use client";

import {
    LayoutDashboard,
    FileText,
    ArrowRight,
    Boxes,
    Sparkles,
    Calendar,
    Info,
    Loader2,
    Bug
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/Dialog";
import LineWaves from '@/components/ui/LineWaves';

interface GitHubRelease {
    id: number;
    tag_name: string;
    published_at: string;
    body: string;
    formattedBody?: string;
}

export interface FeatureCardProps {
    title: string;
    desc: string;
    icon: React.ReactElement<{
        size?: number | string;
        strokeWidth?: number;
    }>;
    href: string;
}

const FeatureCard = ({ title, desc, icon, href }: FeatureCardProps) => (
    <Link href={href} className="group p-6 bg-card/60 backdrop-blur-xl border rounded-xl hover:border-blue-500 transition-all shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/5 rounded-lg text-blue-400 dark:text-blue-500">
                {React.cloneElement(icon, { size: 24 })}
            </div>
            <ArrowRight size={18} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2">{desc}</p>
    </Link>
);

export default function MainPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [latestMajor, setLatestMajor] = useState<GitHubRelease | null>(null);
    const [latestPatch, setLatestPatch] = useState<GitHubRelease | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

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
                const major = data.find(rel => isMajorRelease(rel.tag_name));
                const patch = data.find(rel => !isMajorRelease(rel.tag_name));

                if (major) setLatestMajor({ ...major, formattedBody: formatReleaseBody(major.body) });
                if (patch) setLatestPatch({ ...patch, formattedBody: formatReleaseBody(patch.body) });
            } catch (e) {
                console.error("Failed to fetch releases:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchReleases();
    }, []);

    const isDark = resolvedTheme === "dark";

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex flex-col">
            {mounted && (
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                    <LineWaves
                        speed={0.3}
                        innerLineCount={32}
                        outerLineCount={36}
                        warpIntensity={1}
                        rotation={-45}
                        edgeFadeWidth={0}
                        colorCycleSpeed={1}
                        brightness={isDark ? 0.1 : 0.4}
                        color1={isDark ? "#3b82f6" : "#bfdbfe"}
                        color2={isDark ? "#ffffff" : "#60a5fa"}
                        color3={isDark ? "#1e40af" : "#a78bfa"}
                        enableMouseInteraction
                        mouseInfluence={1.0}
                    />
                    {!isDark && <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]" />}
                </div>
            )}

            <div className="flex flex-col flex-1 p-6 max-w-6xl mx-auto w-full gap-8 md:gap-12 pb-20 relative z-10">
                <section className="mt-10">
                    <h1 className="text-4xl font-bold tracking-tight mb-4 drop-shadow-sm">SHAT Docs</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
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

                <div className="grid sm:grid-cols-2 gap-6">
                    {!loading && latestMajor && (
                        <section className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 backdrop-blur-xl p-5 md:p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden sm:block">
                                <Sparkles size={80} className="text-blue-500" strokeWidth={1.5} />
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
                                    <DialogContent className="max-w-[95vw] sm:max-w-xl bg-card/90 backdrop-blur-2xl border-border shadow-2xl rounded-2xl p-0 overflow-hidden">
                                        <div>
                                            <DialogHeader className="p-4 bg-muted/30 border-b">
                                                <DialogTitle className="text-xl md:text-2xl flex items-center gap-2 tracking-tight leading-none">
                                                    <Sparkles size={20} className="text-blue-500 shrink-0" />
                                                    <span className="mb-0.5">Обновление {latestMajor.tag_name}</span>
                                                </DialogTitle>
                                            </DialogHeader>
                                            <div className="overflow-y-auto flex-1 custom-scrollbar px-6 mb-6 max-h-[60vh]">
                                                <div
                                                    className="text-sm leading-relaxed space-y-2 prose prose-sm dark:prose-invert max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: latestMajor.formattedBody || "" }}
                                                />
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </section>
                    )}

                    {!loading && latestPatch && (
                        <section className="relative overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-xl shadow-sm p-5 md:p-6 animate-in fade-in slide-in-from-bottom-3 duration-600">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden sm:block">
                                <Bug size={80} className="text-blue-500" strokeWidth={1.5} />
                            </div>
                            <div className="relative z-10 flex flex-col gap-5 md:gap-6">
                                <div>
                                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                        <Bug size={15} />
                                        <span className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-foreground/70">
                                            Последний патч
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
                                        <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 w-full sm:w-fit rounded-xl sm:rounded-full bg-muted/50 border border-input text-foreground text-sm font-semibold hover:bg-muted transition-colors">
                                            <Info size={16} />
                                            Посмотреть изменения
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-[95vw] sm:max-w-xl bg-card/90 backdrop-blur-2xl border-border shadow-2xl rounded-2xl p-0 overflow-hidden">
                                        <div>
                                            <DialogHeader className="p-4 bg-muted/30 border-b">
                                                <DialogTitle className="text-xl md:text-2xl flex items-center gap-2 tracking-tight leading-none">
                                                    <Bug size={20} className="shrink-0" />
                                                    <span className="mb-0.5">Патч {latestPatch.tag_name}</span>
                                                </DialogTitle>
                                            </DialogHeader>
                                            <div className="overflow-y-auto flex-1 custom-scrollbar px-6 mb-6 max-h-[60vh]">
                                                <div
                                                    className="text-sm leading-relaxed space-y-2 prose prose-sm dark:prose-invert max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: latestPatch.formattedBody || "" }}
                                                />
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </section>
                    )}
                </div>
                {loading && (
                    <div className="flex items-center justify-center py-10 gap-2">
                        <Loader2 className="animate-spin text-blue-500" size={24} />
                        <p className="text-muted-foreground font-medium">Загружаю блок последних изменений</p>
                    </div>
                )}
            </div>
        </div>
    );
}
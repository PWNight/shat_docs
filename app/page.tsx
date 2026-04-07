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
    name: string;
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
    <Link href={href} className="group relative p-6 bg-card/40 hover:bg-card/60 backdrop-blur-md border border-border/50 hover:border-blue-500/50 rounded-2xl transition-all duration-300 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    {React.cloneElement(icon, { size: 24 })}
                </div>
                <ArrowRight size={18} className="text-muted-foreground group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
            </div>
            <h3 className="font-bold text-lg tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{desc}</p>
        </div>
    </Link>
);

export default function MainPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [latestMajor, setLatestMajor] = useState<GitHubRelease | null>(null);
    const [latestPatch, setLatestPatch] = useState<GitHubRelease | null>(null);
    const [latestBeta, setLatestBeta] = useState<GitHubRelease | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isMajorRelease = (tagName: string) => {
        const version = tagName.replace(/[^0-9.]/g, '');
        return version.endsWith('.0');
    };

    const isBetaRelease = (tagName: string) => {
        return tagName.toLowerCase().includes('-beta');
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

                const major = data.find(rel => isMajorRelease(rel.name) && !isBetaRelease(rel.name));
                const patch = data.find(rel => !isMajorRelease(rel.name) && !isBetaRelease(rel.name));
                const beta = data.find(rel => isBetaRelease(rel.name));

                if (major) setLatestMajor({ ...major, formattedBody: formatReleaseBody(major.body) });
                if (patch) setLatestPatch({ ...patch, formattedBody: formatReleaseBody(patch.body) });
                if (beta) setLatestBeta({ ...beta, formattedBody: formatReleaseBody(beta.body) });
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
        <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col">
            {mounted && (
                <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <FeatureCard title="Личный кабинет" desc="Интуитивно понятная панель управления аккаунтом." icon={<LayoutDashboard/>} href="/profile" />
                    <FeatureCard title="Группы" desc="Учёт успеваемости, посещаемости и списка студентов." icon={<Boxes/>} href="/profile/groups" />
                    <FeatureCard title="Документация" desc="Инструкции и рекомендации по использованию приложения." icon={<FileText/>} href="/wiki" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {!loading && (
                        <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-card/30 backdrop-blur-2xl p-6 md:p-10 shadow-2xl flex flex-col transition-all duration-300 hover:border-blue-500/40 group">
                            <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 via-transparent to-transparent opacity-100" />
                            <div className="absolute top-0 right-0 p-0 opacity-15 pointer-events-none translate-x-1/4 -translate-y-1/4 rotate-12">
                                <Sparkles size={320} className="text-blue-500" strokeWidth={0.5} />
                            </div>

                            <div className="relative z-10 flex flex-col h-full">
                                {latestMajor ? (
                                    <div className="flex flex-col h-full gap-6">
                                        <div className="space-y-4">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 w-fit">
                                                <Sparkles size={14} className="animate-pulse shrink-0" />
                                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">Последнее обновление</span>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none bg-linear-to-r from-foreground via-foreground/90 to-blue-500 bg-clip-text text-transparent wrap-break-word">
                                                    {latestMajor.name}
                                                </h2>
                                                <span className="flex items-center gap-1.5 text-sm md:text-base text-muted-foreground">
                                                    <Calendar size={16} className="text-blue-500" />
                                                    {new Date(latestMajor.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground text-base md:text-lg max-w-sm leading-relaxed font-medium">
                                            Стабильное обновление с ключевыми изменениями и новыми возможностями системы.
                                        </p>
                                        <div className="pt-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <button className="group/btn relative inline-flex items-center justify-center gap-3 px-8 py-4 w-full sm:w-fit rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/25 active:scale-95">
                                                        <Info size={20} />
                                                        Посмотреть изменения
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-[95vw] sm:max-w-xl bg-card/95 backdrop-blur-3xl border-border shadow-2xl rounded-4xl p-0 overflow-hidden">
                                                    <div>
                                                        <DialogHeader className="p-6 bg-blue-500/5 border-b border-blue-500/10">
                                                            <DialogTitle className="text-xl flex items-center gap-3 font-bold">
                                                                <Sparkles size={24} className="text-blue-500 shrink-0" />
                                                                <span>Обновление {latestMajor.name}</span>
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="overflow-y-auto px-6 pb-4 max-h-[60vh] custom-scrollbar prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: latestMajor.formattedBody || "" }} />
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center flex-1 h-full py-20 text-center opacity-40">
                                        <Sparkles size={48} className="mb-4" />
                                        <h3 className="text-2xl font-bold">Готовим мажорный релиз</h3>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    <div className="flex flex-col gap-6">
                        {!loading && (
                            <section className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-card/30 backdrop-blur-2xl p-6 md:p-8 shadow-xl flex-1 transition-all duration-300 hover:border-blue-500/50 group/beta flex flex-col justify-between min-h-55">
                                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover/beta:scale-110 transition-transform">
                                    <Boxes size={100} className="text-blue-500" strokeWidth={1} />
                                </div>

                                {latestBeta ? (
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div className="space-y-4">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 w-fit">
                                                <Boxes size={14} className="animate-pulse" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Последняя бета</span>
                                            </div>
                                            <div className="space-y-2">
                                                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground/90">{latestBeta.name}</h2>
                                                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <Calendar size={15} className="text-blue-500" />
                                                    {new Date(latestBeta.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Тестовая версия с новыми функциями перед выходом в стабильный релиз.
                                            </p>
                                        </div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <button className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-2.5 w-full sm:w-fit rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                                                    Посмотреть изменения
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-[95vw] sm:max-w-xl bg-card/95 backdrop-blur-3xl border-border shadow-2xl rounded-4xl p-0 overflow-hidden">
                                                <div>
                                                    <DialogHeader className="p-6 bg-blue-500/5 border-b border-blue-500/10">
                                                        <DialogTitle className="text-xl flex items-center gap-3 font-bold">
                                                            <Boxes size={24} className="text-blue-500 shrink-0" />
                                                            <span>Бета {latestBeta.name}</span>
                                                        </DialogTitle>
                                                    </DialogHeader>
                                                    <div className="overflow-y-auto px-6 pb-4  max-h-[60vh] custom-scrollbar prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: latestBeta.formattedBody || "" }} />
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                ) : (
                                    <div className="relative z-10 space-y-2">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 w-fit">
                                            <Boxes size={14} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Последняя бета</span>
                                        </div>
                                        <h3 className="text-xl font-bold">Новая бета скоро...</h3>
                                    </div>
                                )}
                            </section>
                        )}

                        {!loading && latestPatch && (
                            <section className="relative overflow-hidden rounded-3xl border border-border bg-card/30 backdrop-blur-2xl p-6 md:p-8 shadow-xl flex-1 transition-all duration-300 hover:border-foreground/10 group/patch flex flex-col justify-between min-h-55">
                                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover/patch:rotate-12 transition-transform">
                                    <Bug size={100} className="text-foreground" strokeWidth={1} />
                                </div>

                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground w-fit">
                                            <Bug size={14} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Последний патч</span>
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground/80">{latestPatch.name}</h2>
                                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <Calendar size={15} className="text-muted-foreground" />
                                                {new Date(latestPatch.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Небольшой релиз с исправлениями ошибок и улучшением стабильности.
                                        </p>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-2.5 w-full sm:w-fit rounded-xl bg-muted/80 border border-border text-foreground text-sm font-bold hover:bg-muted transition-all">
                                                Список исправлений
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-[95vw] sm:max-w-xl bg-card/95 backdrop-blur-3xl border-border shadow-2xl rounded-4xl p-0 overflow-hidden">
                                            <div>
                                                <DialogHeader className="p-6 bg-muted/30 border-b">
                                                    <DialogTitle className="text-xl flex items-center gap-3 font-bold">
                                                        <Bug size={24} className="text-muted-foreground shrink-0" />
                                                        <span>Патч {latestPatch.name}</span>
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <div className="overflow-y-auto px-6 pb-4 max-h-[60vh] custom-scrollbar prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: latestPatch.formattedBody || "" }} />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </section>
                        )}
                    </div>
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
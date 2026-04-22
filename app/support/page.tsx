"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { 
    Bug, 
    CircleHelp, 
    LifeBuoy, 
    Mail, 
    MessageSquareWarning, 
    ArrowRight,
    ArrowLeft
} from "lucide-react";
import { useTheme } from "next-themes";
import LineWaves from "@/components/ui/animations/LineWaves";

const SUPPORT_EMAIL = "support@shat-docs.local";
const TELEGRAM_URL = "https://t.me/PWNight";
const GITHUB_ISSUES_URL = "https://github.com/PWNight/shat_docs/issues";

const ContactCard = ({ title, desc, icon, href, external = false }: { 
    title: string; 
    desc: string; 
    icon: React.ReactNode; 
    href: string;
    external?: boolean;
}) => (
    <a 
        href={href} 
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="group relative p-6 bg-card/40 hover:bg-card/60 backdrop-blur-md border border-border/50 hover:border-blue-500/50 rounded-2xl transition-all duration-300 shadow-sm overflow-hidden flex flex-col h-full"
    >
        <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <ArrowRight size={18} className="text-muted-foreground group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
            </div>
            <h3 className="font-bold text-lg tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{desc}</p>
        </div>
    </a>
);

export default function SupportPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 w-fit mb-4">
                        <LifeBuoy size={14} className="animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Поддержка</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-sm bg-linear-to-r from-foreground to-foreground/70 bg-clip-text">
                        Центр помощи
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                        Если у вас возникли вопросы по работе SHAT Docs или вы обнаружили ошибку, 
                        выберите наиболее удобный способ связи.
                    </p>
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <ContactCard 
                        title="Email" 
                        desc={SUPPORT_EMAIL} 
                        icon={<Mail size={24} />} 
                        href={`mailto:${SUPPORT_EMAIL}`} 
                    />
                    <ContactCard 
                        title="Telegram" 
                        desc="Быстрые вопросы и обсуждение в реальном времени." 
                        icon={<CircleHelp size={24} />} 
                        href={TELEGRAM_URL}
                        external
                    />
                    <ContactCard 
                        title="GitHub Issues" 
                        desc="Для технических баг-репортов и предложений по коду." 
                        icon={<Bug size={24} />} 
                        href={GITHUB_ISSUES_URL}
                        external
                    />
                </div>

                <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-card/30 backdrop-blur-2xl p-6 md:p-10 shadow-2xl transition-all hover:border-blue-500/40">
                    <div className="absolute top-0 right-0 p-0 opacity-15 pointer-events-none translate-x-1/5 -translate-y-1/5 rotate-12">
                        <MessageSquareWarning size={220} className="text-blue-500" strokeWidth={0.5} />
                    </div>

                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                                <MessageSquareWarning className="text-blue-500" />
                                Что приложить к обращению
                            </h2>
                            <p className="text-muted-foreground">Это поможет нам решить проблему значительно быстрее:</p>
                        </div>

                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                "Подробные шаги для воспроизведения ошибки",
                                "Скриншоты или видеозапись экрана с проблемой",
                                "Текст ошибки из консоли разработчика (F12)",
                                "URL страницы, где возникла трудность"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm md:text-base text-muted-foreground">
                                    <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="pt-4 flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-all active:scale-95"
                            >
                                <ArrowLeft size={18} />
                                На главную
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
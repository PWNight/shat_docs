"use client";

import { LayoutDashboard, FileText, Boxes, Loader2 } from "lucide-react";
import React, { useEffect, useState, Suspense } from "react";
import { useTheme } from "next-themes";
import LineWaves from '@/components/ui/animations/LineWaves';
import dynamic from 'next/dynamic';

// Lazy-loaded components
const FeatureCard = dynamic(() => import('@/components/FeatureCard'), {
    loading: () => <div className="p-6 bg-card/40 rounded-2xl animate-pulse" />,
    ssr: false
});

const ReleasesGrid = dynamic(() => import('@/components/ReleasesGrid'), {
    loading: () => (
        <div className="flex items-center justify-center py-10 gap-2">
            <Loader2 className="animate-spin text-blue-500" size={24} />
            <p className="text-muted-foreground font-medium">Загружаю блок последних изменений</p>
        </div>
    ),
    ssr: false
});

export default function MainPage() {
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

                <Suspense fallback={
                    <div className="flex items-center justify-center py-10 gap-2">
                        <Loader2 className="animate-spin text-blue-500" size={24} />
                        <p className="text-muted-foreground font-medium">Загружаю блок последних изменений</p>
                    </div>
                }>
                    <ReleasesGrid />
                </Suspense>
            </div>
        </div>
    );
}
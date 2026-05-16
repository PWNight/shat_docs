"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import ReleaseSection from "./ReleaseSection";
import { Boxes, Bug } from "lucide-react";
import PageErrorState from "@/components/ui/PageErrorState";

interface GitHubRelease {
    id: number;
    name: string;
    published_at: string;
    body: string;
    formattedBody?: string;
}

export default function ReleasesGrid() {
    const [latestMajor, setLatestMajor] = useState<GitHubRelease | null>(null);
    const [latestPatch, setLatestPatch] = useState<GitHubRelease | null>(null);
    const [latestBeta, setLatestBeta] = useState<GitHubRelease | null>(null);
    const [loading, setLoading] = useState(true);
    const [releasesError, setReleasesError] = useState<string | null>(null);

    const isMajorRelease = (tagName: string) => {
        const version = tagName.replace(/[^0-9.]/g, '');
        return version.endsWith('.0');
    };

    const isBetaRelease = (tagName: string) => {
        return tagName.toLowerCase().includes('-beta');
    };

    const formatReleaseBody = (body: string) => {
        if (!body) return "Описание изменений отсутствует.";
        const formatted = body
            .replace(/^### (.*$)/gim, '<h3 class="font-bold text-lg mt-4 mb-2 flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="font-bold text-xl mt-4 mb-2 border-l-4 border-blue-500 pl-3">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="font-bold text-2xl mt-4 mb-2">$1</h1>')
            .replace(/^\* (.*$)/gim, '<li class="ml-6 list-none flex items-start gap-2 mb-1"><span class="mt-1.5 text-blue-500"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span><span>$1</span></li>')
            .replace(/^- (.*$)/gim, '<li class="ml-6 list-none flex items-start gap-2 mb-1"><span class="mt-1.5 text-blue-500"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span><span>$1</span></li>')
            .replace(/\*\*(.*)\*\*/gim, '<strong class="text-blue-600 dark:text-blue-400">$1</strong>');
        
        // DOMPurify will be used in the parent component
        return formatted;
    };

    useEffect(() => {
        const fetchReleases = async () => {
            try {
                setReleasesError(null);
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
                setReleasesError(e instanceof Error ? e.message : "Нет подключения к интернету");
            } finally {
                setLoading(false);
            }
        };
        fetchReleases();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10 gap-2">
                <Loader2 className="animate-spin text-blue-500" size={24} />
                <p className="text-muted-foreground font-medium">Загружаю блок последних изменений</p>
            </div>
        );
    }

    if (releasesError) {
        return (
            <PageErrorState
                kind="network"
                title="Нет подключения к интернету"
                description="Не удалось загрузить информацию о последних релизах."
                details={releasesError}
                onAction={() => window.location.reload()}
            />
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <ReleaseSection
                release={latestMajor}
                description="Стабильное обновление с ключевыми изменениями и новыми возможностями системы."
                badgeText="Последнее обновление"
                icon={<Boxes />}
                variant="major"
            />

            <div className="flex flex-col gap-6">
                <ReleaseSection
                    release={latestBeta}
                    description="Тестовая версия с новыми функциями перед выходом в стабильный релиз."
                    badgeText="Последняя бета"
                    icon={<Boxes />}
                    variant="beta"
                    error={releasesError}
                />

                <ReleaseSection
                    release={latestPatch}
                    description="Небольшой релиз с исправлениями ошибок и улучшением стабильности."
                    badgeText="Последний патч"
                    icon={<Bug />}
                    variant="patch"
                    error={releasesError}
                />
            </div>
        </div>
    );
}

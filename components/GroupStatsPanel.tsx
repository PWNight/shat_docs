"use client";

import type { ReactNode } from "react";
import {
    Users,
    GraduationCap,
    ClipboardCheck,
    Clock,
    CalendarDays,
    TrendingUp,
    AlertTriangle,
} from "lucide-react";
import type { GroupStats } from "@/utils/group-stats";

type GroupStatsPanelProps = {
    stats: GroupStats;
    compact?: boolean;
};

function StatTile({
    icon,
    label,
    value,
    hint,
    tone = "default",
}: {
    icon: ReactNode;
    label: string;
    value: string | number;
    hint?: string;
    tone?: "default" | "success" | "warning" | "danger";
}) {
    const toneClasses = {
        default: "border-border/70 bg-muted/30",
        success: "border-emerald-500/30 bg-emerald-500/5",
        warning: "border-amber-500/30 bg-amber-500/5",
        danger: "border-red-500/30 bg-red-500/5",
    };

    return (
        <div className={`rounded-xl border p-3 ${toneClasses[tone]}`}>
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-lg font-bold leading-none text-foreground">{value}</p>
            {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
    );
}

export default function GroupStatsPanel({ stats, compact = false }: GroupStatsPanelProps) {
    const avgGradeDisplay = stats.avg_grade != null ? stats.avg_grade.toFixed(2) : "—";
    
    // Цветовая логика для среднего балла
    const gradeTone = stats.avg_grade != null 
        ? (stats.avg_grade >= 4.5 ? "success" : stats.avg_grade >= 3.5 ? "default" : "danger")
        : "default";
    
    // Цветовая логика для пропусков (дни)
    const daysMissedTone = stats.days_missed <= 2 ? "success" : stats.days_missed <= 7 ? "warning" : "danger";
    
    // Цветовая логика для пропусков (пары)
    const lessonsMissedTone = stats.lessons_missed <= 5 ? "success" : stats.lessons_missed <= 15 ? "warning" : "danger";
    
    // Цветовая логика для опозданий
    const lateTone = stats.late_total <= 2 ? "success" : stats.late_total <= 5 ? "warning" : "danger";
    
    // Цветовая логика для отличников (процент от студентов)
    const excellentPercent = stats.students_count > 0 ? (stats.excellent_students / stats.students_count) * 100 : 0;
    const excellentTone = excellentPercent >= 30 ? "success" : excellentPercent >= 10 ? "default" : "warning";
    
    // Цветовая логика для студентов под риском
    const atRiskTone = stats.at_risk_students === 0 ? "success" : stats.at_risk_students <= 2 ? "warning" : "danger";

    return (
        <section className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Статистика группы
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {stats.grades_periods} пер. успеваемости · {stats.attendance_periods} пер. посещаемости
                </span>
            </div>

            <div
                className={
                    compact
                        ? "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
                        : "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
                }
            >
                <StatTile
                    icon={<Users className="h-3.5 w-3.5" />}
                    label="Студенты"
                    value={stats.students_count}
                />
                <StatTile
                    icon={<GraduationCap className="h-3.5 w-3.5" />}
                    label="Средний балл"
                    value={avgGradeDisplay}
                    tone={gradeTone}
                />
                <StatTile
                    icon={<TrendingUp className="h-3.5 w-3.5" />}
                    label="Отличники"
                    value={stats.excellent_students}
                    hint="средний балл ≥ 4,5"
                    tone={excellentTone}
                />
                <StatTile
                    icon={<AlertTriangle className="h-3.5 w-3.5" />}
                    label="Под риском"
                    value={stats.at_risk_students}
                    hint="средний балл < 3,5"
                    tone={atRiskTone}
                />
                <StatTile
                    icon={<CalendarDays className="h-3.5 w-3.5" />}
                    label="Пропуски (дни)"
                    value={stats.days_missed}
                    hint={`${stats.days_sick} дн. по болезни`}
                    tone={daysMissedTone}
                />
                <StatTile
                    icon={<ClipboardCheck className="h-3.5 w-3.5" />}
                    label="Пропуски (пары)"
                    value={stats.lessons_missed}
                    hint={`${stats.lessons_sick} по болезни`}
                    tone={lessonsMissedTone}
                />
                <StatTile
                    icon={<Clock className="h-3.5 w-3.5" />}
                    label="Опоздания"
                    value={stats.late_total}
                    tone={lateTone}
                />
            </div>
        </section>
    );
}

"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function StatCard({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: number;
}) {
    const colorMap: Record<string, { border: string; icon: string; iconBg: string }> = {
        "Пользователей": { border: "border-gray-100 dark:border-zinc-700", icon: "text-blue-600 dark:text-blue-400", iconBg: "bg-gray-100 dark:bg-zinc-700/50" },
        "Регистраций в очереди": { border: "border-gray-100 dark:border-zinc-700", icon: "text-amber-600 dark:text-amber-400", iconBg: "bg-gray-100 dark:bg-zinc-700/50" },
        "Админов": { border: "border-gray-100 dark:border-zinc-700", icon: "text-violet-600 dark:text-violet-400", iconBg: "bg-gray-100 dark:bg-zinc-700/50" },
        "Групп": { border: "border-gray-100 dark:border-zinc-700", icon: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-gray-100 dark:bg-zinc-700/50" },
        "Студентов": { border: "border-gray-100 dark:border-zinc-700", icon: "text-cyan-600 dark:text-cyan-400", iconBg: "bg-gray-100 dark:bg-zinc-700/50" },
        "Сбросов паролей в очереди": { border: "border-gray-100 dark:border-zinc-700", icon: "text-rose-600 dark:text-rose-400", iconBg: "bg-gray-100 dark:bg-zinc-700/50" },
    };
    const tone = colorMap[label] || { border: "border-border", icon: "text-muted-foreground", iconBg: "bg-muted" };
    return (
        <div className={`group relative overflow-hidden bg-card p-4 sm:p-5 rounded-2xl border ${tone.border} shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm`}>
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none bg-gradient-to-br from-blue-500/5 to-transparent" />
            <div className={`${tone.iconBg} ${tone.icon} w-10 h-10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 transition-transform group-hover:scale-110 relative z-10`}>
                <div className="[&>svg]:w-5 [&>svg]:h-5">{icon}</div>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1 tracking-wider break-words relative z-10">{label}</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground leading-none relative z-10">{value}</p>
        </div>
    );
}

export function TabButton({
    active,
    label,
    onClick,
    icon,
}: {
    active: boolean;
    label: string;
    onClick: () => void;
    icon?: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 h-10 min-h-10 whitespace-nowrap text-center flex-1 sm:flex-none sm:min-w-[160px] z-10 ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
        >
            {active ? (
                <motion.div
                    layoutId="adminActiveTab"
                    className="absolute inset-0 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-sm -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
            ) : null}
            <span className="inline-flex items-center justify-center gap-2">
                {icon ? <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span> : null}
                {label}
            </span>
        </button>
    );
}

export function ActionButton({
    loading,
    className,
    children,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
    return (
        <Button {...props} disabled={props.disabled || loading} className={className}>
            <span className="inline-flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {children}
            </span>
        </Button>
    );
}

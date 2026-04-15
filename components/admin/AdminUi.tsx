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
        <div className={`bg-card p-5 rounded-lg border ${tone.border} shadow-sm hover:shadow-md transition-all duration-300 group`}>
            <div className={`${tone.iconBg} ${tone.icon} w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <div className="[&>svg]:w-5 [&>svg]:h-5">{icon}</div>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1 tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        </div>
    );
}

export function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 h-10 min-h-10 whitespace-nowrap text-center min-w-[160px] z-10 ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
        >
            {active ? (
                <motion.div
                    layoutId="adminActiveTab"
                    className="absolute inset-0 bg-card border border-border rounded-xl shadow-sm -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
            ) : null}
            {label}
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

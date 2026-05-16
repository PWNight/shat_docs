import React from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export interface FeatureCardProps {
    title: string;
    desc: string;
    icon: React.ReactElement<{
        size?: number | string;
        strokeWidth?: number;
    }>;
    href: string;
}

export default function FeatureCard({ title, desc, icon, href }: FeatureCardProps) {
    return (
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
}

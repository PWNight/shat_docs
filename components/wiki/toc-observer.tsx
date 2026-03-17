"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function TocObserver({ data }: { data: any[] }) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const handleIntersect = (entries: IntersectionObserverEntry[]) => {
            const visibleEntry = entries.find((entry) => entry.isIntersecting);
            if (visibleEntry) setActiveId(visibleEntry.target.id);
        };

        observer.current = new IntersectionObserver(handleIntersect, {
            rootMargin: "-10% 0px -80% 0px", // Активация в верхней части экрана
            threshold: 1.0,
        });

        data.forEach((item) => {
            const el = document.getElementById(item.href.slice(1));
            if (el) observer.current?.observe(el);
        });

        return () => observer.current?.disconnect();
    }, [data]);

    return (
        <nav className="flex flex-col gap-2 text-sm">
            {data.map(({ href, level, text }, index) => (
                <Link
                    key={index}
                    href={href}
                    className={clsx(
                        "transition-colors hover:text-foreground",
                        level === 3 && "pl-4",
                        level === 4 && "pl-8",
                        activeId === href.slice(1)
                            ? "font-medium text-primary"
                            : "text-muted-foreground"
                    )}
                >
                    {text}
                </Link>
            ))}
        </nav>
    );
}
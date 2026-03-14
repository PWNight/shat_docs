"use client";
import Link from "next/link";
import { buttonVariants } from "./ui/Button";
import React, { useState } from "react";
import Image from "next/image";
import { LifeBuoy, Info, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/Dialog";


export function FooterButtons(){
    return (
        <div className="flex items-center gap-2">
            <Link
                href="/support"
                className={buttonVariants({
                    size: "icon",
                    className: "h-9 w-9 rounded-full bg-muted dark:bg-zinc-600 transition-all duration-200",
                })}
            >
                <LifeBuoy className="h-5 w-5 dark:text-white" />
            </Link>
            <Link
                href="https://github.com/PWNight/shat_docs"
                target="_blank"
                className={buttonVariants({
                    size: "icon",
                    className: "h-9 w-9 rounded-full bg-muted dark:bg-zinc-600 transition-all duration-200",
                })}
            >
                <svg className={"w-5 h-5 fill-white"} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            </Link>
        </div>
    )
}
export function Footer() {
    const appVersion = process.env.APP_VERSION || "1.0.0";
    const [changelog, setChangelog] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const fetchChangelog = async () => {
        if (changelog) return;
        setIsLoading(true);
        try {
            const res = await fetch(`https://api.github.com/repos/PWNight/shat_docs/releases/tags/v${appVersion}`);
            const data = await res.json();
            const formatted = data.body
                ? data.body
                    .replace(/^### (.*$)/gim, '<h3 class="font-bold text-lg mt-4 mb-2">$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2 class="font-bold text-xl mt-4 mb-2">$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1 class="font-bold text-2xl mt-4 mb-2">$1</h1>')
                    .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
                    .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
                    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                : "Описание изменений отсутствует.";
            setChangelog(formatted);
        } catch (e) {
            console.log(e)
            setChangelog("Не удалось загрузить список изменений.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <footer className="w-full p-2 px-6 border-t bg-muted/10 flex flex-row justify-between gap-4 items-center">
            <div className="flex items-center gap-3">
                <Image
                    src="/logo.png"
                    alt="SHAT Logo"
                    width={36}
                    height={36}
                    quality={100}
                    className="shrink-0 transition-transform hover:scale-105"
                />
                <div className="flex flex-col gap-1">
                    <p className="text-sm opacity-90">SHAT Docs © 2025-{new Date().getFullYear()}</p>
                    <div className="flex items-center gap-1">
                        <Dialog onOpenChange={(open) => open && fetchChangelog()}>
                            <DialogTrigger asChild>
                                <button className="flex items-center gap-1 text-[11px] text-blue-500 hover:underline transition-colors">
                                    <Info size={12} />
                                    v{appVersion} (о версии)
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] sm:max-w-lg bg-card border-border shadow-2xl rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold border-b pb-2 text-left">
                                        Список изменений v{appVersion}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="mt-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center py-12 gap-3">
                                            <Loader2 className="animate-spin text-blue-500" />
                                            <p className="text-sm text-muted-foreground">Загрузка данных с GitHub...</p>
                                        </div>
                                    ) : (
                                        <div
                                            className="text-sm leading-relaxed text-foreground/90"
                                            dangerouslySetInnerHTML={{ __html: changelog }}
                                        />
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
            <FooterButtons/>
        </footer>
    );
}
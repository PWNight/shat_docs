import Link from "next/link";
import { buttonVariants } from "./ui/Button";
import React from "react";
import Image from "next/image";
import { LifeBuoy } from "lucide-react";

export function Footer() {
    const appVersion = process.env.APP_VERSION;

    return (
        <footer className="w-full p-2 px-6 border-t bg-muted/10 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-3">
                <Image
                    src="/logo.png"
                    alt="FoxWorld Logo"
                    width={36}
                    height={36}
                    quality={100}
                    className="flex-shrink-0 transition-transform hover:scale-105"
                />
                <div className="">
                    <p className="text-sm opacity-90">SHAT Docs © 2025-{new Date().getFullYear()}</p>
                    <p className="text-xs opacity-70">Version {appVersion}</p>
                </div>
            </div>
            <FooterButtons />
        </footer>
    );
}

export function FooterButtons() {
    return (
        <div className="flex items-center gap-2">
            <Link
                href="https://t.me/rodiongoshev"
                className={buttonVariants({
                    size: "icon",
                    className:
                        "h-9 w-9 rounded-full bg-muted transition-all duration-200",
                })}
            >
                <LifeBuoy className="h-4 w-4" />
            </Link>
        </div>
    );
}
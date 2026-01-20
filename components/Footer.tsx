import Link from "next/link";
import { buttonVariants } from "./ui/Button";
import React from "react";
import Image from "next/image";
import { LifeBuoy } from "lucide-react";

export function Footer() {
    return (
        <footer className="w-full p-2 px-6 border-t bg-muted/10">
            {/* Первая строка: Копирайт и соцсети */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
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
                        <p className="text-sm opacity-90">SHAT Docs © 2025-2026</p>
                        <p className="text-xs opacity-70">Version 0.7.1</p>
                    </div>
                </div>
                <FooterButtons />
            </div>

            {/* Вторая строка: Юридические ссылки и информация */}
            <div className="flex flex-col gap-4">
                <div className="flex items-start flex-wrap flex-row gap-4 sm:gap-6">
                    <Link
                        href="/docs/legal/terms"
                        className={buttonVariants({
                            variant: "link",
                            size: "xs",
                            className: "!px-0 text-xs hover:text-accent-foreground",
                        })}
                    >
                        Условия пользования
                    </Link>
                    <Link
                        href="/docs/legal/privacy"
                        className={buttonVariants({
                            variant: "link",
                            size: "xs",
                            className: "!px-0 text-xs hover:text-accent-foreground",
                        })}
                    >
                        Политика конфиденциальности
                    </Link>
                </div>
            </div>
        </footer>
    );
}

export function FooterButtons() {
    return (
        <div className="flex gap-3">
            <Link
                href="https://t.me/foxworldteam"
                className={buttonVariants({
                    size: "icon",
                    className:
                        "h-9 w-9 rounded-full bg-muted transition-all duration-200",
                })}
            >
                <svg
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    className="h-4 w-4"
                >
                    <path d="M2.53419 10.491 20.4342 3.72755c.5979-.22564 1.2652.07521 1.4908.67307.0791.21021.0964.43779.0482.65668l-3.0857 14.0805c-.1562.7136-.8611 1.1658-1.5747 1.0086-.1774-.0385-.3442-.1138-.4918-.2198l-6.1453-4.4415c-.3694-.2671-.4533-.784-.1852-1.1543.0289-.0395.0617-.0771.0964-.1118l6.319-6.07213c.1311-.12632.135-.33557.0087-.46768-.109-.11282-.2826-.13404-.4156-.04918L7.88597 13.0975c-.5101.324-1.13978.3973-1.7116.1996l-3.618-1.2516c-.43103-.1485-.65957-.6201-.51107-1.0511.081-.2314.25939-.4166.48889-.5034Z" />
                </svg>
            </Link>
            <Link
                href="mailto:support@foxworld.ru"
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
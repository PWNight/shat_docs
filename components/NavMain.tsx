import Link from "next/link";
import Anchor from "@/components/ui/Anchor";
import { SheetLeftbar } from "./LeftBar";
import Image from "next/image";
import { Home, BookOpen } from "lucide-react";
import {SheetClose} from "@/components/ui/Sheet";
import {getSession} from "@/utils/session";
import {AuthButton} from "@/components/AccountButton";

export const NAVLINKS = [
    {
        title: "Главная",
        href: "/",
        icon: <Home className="w-4 h-4" />,
    },
    {
        title: "Документация",
        href: "/docs",
        icon: <BookOpen className="w-4 h-4" />,
    }
];

export async function Navbar() {
    return (
        <nav className="w-full border-b max-h-16 p-2 px-4 sm:px-10 flex items-center shadow-md bg-gray-200/10 dark:bg-gray-900/10 text-gray-900 dark:text-white">
            <div className="w-full h-full flex items-center justify-between gap-2">
                <div className="flex items-center h-full gap-8">
                    <div className="sm:text-2xl text-lg">
                        <Logo />
                    </div>
                    <SheetLeftbar />
                    <div className="lg:flex hidden items-center gap-6 h-full select-none">
                        <NavMenu />
                    </div>
                </div>

                <div className="flex items-center">
                    <AuthButton/>
                </div>
            </div>
        </nav>
    );
}

export function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Image
                src="/logo.png"
                alt="logo"
                width={50}
                height={50}
                quality={100}
                className="w-10 h-10 drop-shadow-md"
            />
            <h2 className="font-bold text-blue-500 mb-1 sm:text-xl text-sm">SHAT Docs</h2>
        </Link>
    );
}

export function NavMenu({ isSheet = false }) {
    return (
        <>
            {NAVLINKS.map((item) => {
                const Comp = (
                    <Anchor
                        key={item.title + item.href}
                        activeClassName="text-blue-500 font-semibold rounded-md"
                        absolute
                        className="flex items-center gap-2 py-1.5 hover:text-blue-500 transition-all duration-200 group"
                        href={item.href}
                    >
            <span className="group-[.active]:text-blue-500 transition-colors duration-200">
              {item.icon}
            </span>
                        {item.title}
                    </Anchor>
                );
                return isSheet ? (
                    <SheetClose key={item.title + item.href} asChild>
                        {Comp}
                    </SheetClose>
                ) : (
                    Comp
                );
            })}
        </>
    );
}
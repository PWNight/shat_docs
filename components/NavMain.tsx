import Link from "next/link";
import Anchor from "@/components/ui/Anchor";
import { SheetLeftbar } from "./LeftBar";
import Image from "next/image";
import { Home, BookOpen } from "lucide-react";
import { AuthButton } from "@/components/AccountButton";
import { ModeToggle } from "@/components/theme-toggle";

export const NAVLINKS = [
    {
        title: "Главная",
        href: "/",
        icon: <Home className="w-4 h-4" />,
    },
    {
        title: "Документация",
        href: "/wiki",
        icon: <BookOpen className="w-4 h-4" />,
    }
];

export async function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border backdrop-blur-md bg-background/80 px-2 sm:px-4 lg:px-10 h-16 flex items-center shadow-sm">
            <div className="w-full flex items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                    <Logo />
                    <div className="lg:hidden">
                        <SheetLeftbar />
                    </div>
                    <div className="hidden lg:flex items-center gap-6 ml-4">
                        <NavMenu />
                    </div>
                </div>

                <div className="hidden min-[400px]:flex items-center gap-2">
                    <ModeToggle />
                    <AuthButton />
                </div>
            </div>
        </nav>
    );
}

export function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
                src="/logo.png"
                alt="logo"
                width={32}
                height={32}
                className="w-8 h-8 min-w-8"
            />
            <h2 className="font-bold text-blue-500 text-sm sm:text-lg hidden min-[280px]:block">
                SHAT Docs
            </h2>
        </Link>
    );
}

export function NavMenu({ isSheet = false }) {
    return (
        <div className={isSheet ? "flex flex-col w-full" : "flex items-center"}>
            {NAVLINKS.map((item) => (
                <Anchor
                    key={item.title + item.href}
                    activeClassName="bg-accent text-accent-foreground font-medium"
                    absolute
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isSheet ? "w-full text-base" : "text-sm hover:text-blue-500"
                    }`}
                    href={item.href}
                >
                    {item.icon}
                    {item.title}
                </Anchor>
            ))}
        </div>
    );
}
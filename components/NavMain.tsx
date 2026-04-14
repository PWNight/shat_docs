import Link from "next/link";
import Anchor from "@/components/ui/Anchor";
import { SheetLeftbar } from "./LeftBar";
import Image from "next/image";
import { Home, BookOpen, LifeBuoy } from "lucide-react";
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
    },
    {
        title: "Поддержка",
        href: "/support",
        icon: <LifeBuoy className="w-4 h-4" />,
    }
];

export async function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border backdrop-blur-md bg-background/80 px-4 lg:px-10 h-16 flex items-center shadow-sm">
            <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Logo />
                    <div className="lg:hidden">
                        <SheetLeftbar />
                    </div>
                    <div className="hidden lg:flex items-center gap-6 ml-4">
                        <NavMenu />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <div className="hidden lg:block">
                        <AuthButton />
                    </div>
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
        <div className={isSheet ? "flex flex-col gap-1 w-full" : "flex items-center"}>
            {NAVLINKS.map((item) => (
                <Anchor
                    key={item.title + item.href}
                    activeClassName={isSheet ? "bg-blue-500/10 text-blue-600" : "text-blue-600 font-medium"}
                    absolute
                    className={`flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all ${
                        isSheet
                            ? "w-full text-[15px] font-medium hover:bg-muted active:scale-[0.98]"
                            : "text-sm hover:text-blue-500"
                    }`}
                    href={item.href}
                >
                    <span className={isSheet ? "text-blue-500" : ""}>{item.icon}</span>
                    {item.title}
                </Anchor>
            ))}
        </div>
    );
}
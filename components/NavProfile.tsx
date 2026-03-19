import Anchor from "@/components/ui/Anchor";
import { House, GraduationCap } from "lucide-react";

export function NavProfile() {
    const navItems = [
        { href: "/profile", label: "Главная", icon: House }, // Сократил для узких экранов
        { href: "/profile/groups", label: "Группы", icon: GraduationCap },
    ];

    return (
        <div className="dark:bg-card h-fit bg-card text-card-foreground rounded-xl shadow-sm border border-border p-3 sm:p-6 transition-colors">
            <h1 className="text-center text-lg sm:text-2xl font-bold pb-4 border-b border-border">
                Навигация
            </h1>

            <nav className="mt-4 space-y-1.5">
                {navItems.map(({ href, label, icon: Icon }) => (
                    <Anchor
                        key={href}
                        href={href}
                        absolute
                        className="group flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-4 py-2.5 rounded-lg text-foreground hover:bg-blue-600 hover:text-white transition-all duration-200 font-medium text-base overflow-hidden"
                        activeClassName="bg-blue-600 text-white shadow-md"
                    >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="truncate">{label}</span>
                    </Anchor>
                ))}
            </nav>
        </div>
    );
}
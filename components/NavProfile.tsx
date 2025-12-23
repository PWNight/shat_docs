import Anchor from "@/components/ui/Anchor";
import {House, GraduationCap, FileChartColumn} from "lucide-react";

export function NavProfile() {
    const navItems = [
        { href: "/profile", label: "Главная страница", icon: House },
        { href: "/profile/groups", label: "Группы", icon: GraduationCap },
        { href: "/profile/reports", label: "Отчёты", icon: FileChartColumn },
    ];

    return (
        <div className="h-fit mt-4 bg-white rounded-xl shadow-sm border border-neutral-200/70 dark:bg-neutral-800 dark:border-neutral-700 p-5 sm:p-6">
            <h1 className="text-center text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                Навигация
            </h1>

            <nav className="mt-5 space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => (
                    <Anchor
                        key={href}
                        href={href}
                        absolute
                        className="group flex items-center gap-3 w-full px-4 py-3 rounded-lg text-neutral-700 hover:bg-blue-500 hover:text-white transition-all duration-200 font-medium text-base"
                        activeClassName="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-700"
                    >
                        <Icon className="w-5 h-5 shrink-0 transition-colors duration-200 group-hover:text-white" />
                        <span className="transition-colors duration-200">{label}</span>
                    </Anchor>
                ))}
            </nav>
        </div>
    );
}
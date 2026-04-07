import Anchor from "@/components/ui/Anchor";
import { LogIn, UserCircle, LogOut, ChevronDown, GraduationCap, ShieldCheck } from "lucide-react";
import { getSession, deleteSession } from "@/utils/session";
import { redirect } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { queryOne } from "@/utils/mysql";

export async function AuthButton() {
    const session = await getSession();
    const isLoggedIn = !!session;
    const adminAccess = isLoggedIn
        ? await queryOne<{ canAccessAdmin: number; isRoot: number }>(
            "SELECT canAccessAdmin, isRoot FROM users WHERE id = ? LIMIT 1",
            [session.uid]
        )
        : null;
    const canOpenAdmin = !!adminAccess && (Number(adminAccess.canAccessAdmin) === 1 || Number(adminAccess.isRoot) === 1);

    async function handleLogout() {
        "use server";
        await deleteSession();
        redirect("/");
    }

    if (!isLoggedIn) {
        return (
            <Anchor
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 font-semibold hover:bg-blue-600 text-white bg-blue-500"
            >
                <LogIn className="w-4 h-4" />
                <span>Войти</span>
            </Anchor>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold transition-all hover:bg-blue-700 focus:outline-none">
                <UserCircle className="w-5 h-5" />
                <span className="text-sm inline">Кабинет</span>
                <ChevronDown className="w-4 h-4 opacity-70" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 p-2 mt-2">
                <DropdownMenuItem asChild>
                    <Anchor
                        href="/profile"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-muted"
                    >
                        <UserCircle className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Профиль</span>
                    </Anchor>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Anchor
                        href="/profile/groups"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-muted"
                    >
                        <GraduationCap className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Группы</span>
                    </Anchor>
                </DropdownMenuItem>
                {canOpenAdmin ? (
                    <DropdownMenuItem asChild>
                        <Anchor
                            href="/admin"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-muted"
                        >
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">Админ панель</span>
                        </Anchor>
                    </DropdownMenuItem>
                ) : null}

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem className="p-0">
                    <form action={handleLogout} className="w-full">
                        <button
                            type="submit"
                            className="flex w-full items-center gap-2 px-3 py-2 text-red-600 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="font-medium">Выйти</span>
                        </button>
                    </form>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
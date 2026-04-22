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
import { DatabaseZap } from "lucide-react";

export async function AuthButton() {
    let dbOffline = false;
    // Получаем сессию
    const session = await getSession();
    // Проверяем, что сессия существует
    const isLoggedIn = !!session;
    // Проверяем, что пользователь имеет доступ к админ панели
    const adminAccess = isLoggedIn
        ? await (async () => {
            try {
                // Получаем пользователя по его uid
                return await queryOne<{ canAccessAdmin: number; isRoot: number }>(
                    "SELECT canAccessAdmin, isRoot FROM users WHERE id = ? LIMIT 1",
                    [session.uid]
                );
            } catch {
                // Если произошла ошибка, устанавливаем флаг offline
                dbOffline = true;
                return null;
            }
        })()
        : null;
    // Проверяем, что пользователь имеет доступ к админ панели
    const canOpenAdmin = !!adminAccess && (Number(adminAccess.canAccessAdmin) === 1 || Number(adminAccess.isRoot) === 1);
    // Функция для выхода из аккаунта
    async function handleLogout() {
        "use server";
        // Удаляем сессию
        await deleteSession();
        // Перенаправляем на главную страницу
        redirect("/");
    }
    // Если пользователь не авторизован, возвращаем кнопку для входа
    if (!isLoggedIn) {
        return (
            <Anchor
                href="/login"
                prefetch={false}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 font-semibold hover:bg-blue-600 text-white bg-blue-500"
            >
                <LogIn className="w-4 h-4" />
                <span>Войти</span>
            </Anchor>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white font-semibold transition-all hover:bg-blue-600 focus:outline-none">
                <UserCircle className="w-5 h-5" />
                <span className="text-sm inline">Кабинет</span>
                <ChevronDown className="w-4 h-4 opacity-70" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 p-2 mt-2">
                {dbOffline ? (
                    <>
                        <div className="px-3 py-2 mb-1 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
                            <div className="flex items-center gap-2">
                                <DatabaseZap className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Нет подключения к БД</span>
                            </div>
                            <p className="mt-1 text-xs leading-snug opacity-90">
                                Часть функций может быть недоступна.
                            </p>
                        </div>
                        <DropdownMenuSeparator className="my-1" />
                    </>
                ) : null}
                <DropdownMenuItem asChild>
                    <Anchor
                        href="/profile"
                        prefetch={false}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-muted"
                    >
                        <UserCircle className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Профиль</span>
                    </Anchor>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Anchor
                        href="/profile/groups"
                        prefetch={false}
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
                            prefetch={false}
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
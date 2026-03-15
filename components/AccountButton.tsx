import Anchor from "@/components/ui/Anchor";
import { LogIn, UserCircle, LogOut } from "lucide-react";
import { getSession, deleteSession } from "@/utils/session";
import { redirect } from "next/navigation";

export async function AuthButton() {
    const session = await getSession();
    const isLoggedIn = !!session;

    async function handleLogout() {
        "use server";
        await deleteSession();
        redirect("/");
    }

    if (!isLoggedIn) {
        return (
            <Anchor
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-sm hover:shadow-md hover:bg-blue-600 text-white bg-blue-500"
            >
                <LogIn className="w-4 h-4" />
                <span>Войти</span>
            </Anchor>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Anchor
                href="/profile"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-sm hover:shadow-md bg-blue-600 hover:bg-blue-700 text-white"
            >
                <UserCircle className="w-4 h-4" />
                <span className="text-sm truncate">
                    Профиль
                </span>
            </Anchor>

            <form action={handleLogout}>
                <button
                    type="submit"
                    className="flex items-center justify-center p-2.5 rounded-xl bg-red-50 dark:bg-neutral-800 text-red-600 hover:bg-red-600! hover:text-white transition-all duration-200 shadow-sm"
                    title="Выйти"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
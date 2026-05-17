"use client";

import { useFormStatus } from "react-dom";
import { LogOut, Loader2 } from "lucide-react";

export function LogoutButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center gap-2 px-3 py-2 text-red-600 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
        >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            <span className="font-medium">{pending ? "Выход..." : "Выйти"}</span>
        </button>
    );
}

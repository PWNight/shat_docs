"use client"
import {useActionState, useEffect, useState} from "react";
import {Loader2, UserPlusIcon} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useSearchParams} from "next/navigation";

function signup() {

}

export default function LoginPage() {
    const [state, action, pending] = useActionState(signup, undefined);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("to") || "/profile";

    useEffect(() => {

    }, [state, router, redirectTo]);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="flex items-center justify-center h-screen">
            <form
                className="w-full max-w-md mx-auto bg-white rounded-2xl p-8 shadow-lg text-gray-900"
                action={action}
            >
                <h1 className="text-3xl font-bold mb-4 select-none">Вход в систему</h1>
                <div className="mb-4">
                    <label htmlFor="username" className="block mb-1 font-medium text-sm">
                        Почта
                    </label>
                    <input
                        type="text"
                        autoComplete="email"
                        id="email"
                        name="email"
                        className="shadow-lg w-full px-4 py-3 bg-gray-50  border border-gray-200  rounded-lg focus:ring focus:ring-blue-400 focus:border-blue-400 outline-none transition-all placeholder-gray-400"
                        placeholder="test@test.com"
                    />
                    {state?.errors?.username && (
                        <p className="text-red-400 text-sm mt-2">{state.errors.username}</p>
                    )}
                </div>
                <div className="mb-6">
                    <label htmlFor="password" className="block mb-1 font-medium text-sm">
                        Пароль
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            id="password"
                            name="password"
                            className="shadow-lg w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring focus:ring-blue-400 focus:border-blue-400 outline-none transition-all placeholder-gray-400"
                            placeholder="********"
                        />
                        {state?.errors?.password && (
                            <p className="text-red-400 text-sm mt-2">{state.errors.password}</p>
                        )}
                    </div>
                    <div className="flex justify-between items-center mt-6 text-sm">
                        <label className="flex items-center gap-2 select-none">
                            <input
                                id="show-password"
                                type="checkbox"
                                className="h-4 w-4 text-blue-400 focus:ring-blue-400 border-gray-300 rounded"
                                onChange={togglePasswordVisibility}
                            />
                            Показать пароль
                        </label>
                        <Link
                            href="https://t.me/pwnight"
                            className="text-blue-400 hover:text-blue-500 transition-colors"
                        >
                            Забыли пароль?
                        </Link>
                    </div>
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-400 hover:bg-blue-500 text-white font-medium py-3 px-5 rounded-lg focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg select-none"
                    disabled={pending}
                >
                    {pending ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Вход...
                        </>
                    ) : (
                        "Войти"
                    )}
                </button>
                <div className="mt-6 text-sm">
                    <p className="text-gray-600  flex items-center gap-2">
                        Впервые здесь?
                        <Link
                            href="/register"
                            className="text-blue-400 hover:text-blue-500 flex items-center gap-2 transition-colors"
                        >
                            Создать аккаунт
                            <UserPlusIcon className="h-4 w-4" />
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    )
}
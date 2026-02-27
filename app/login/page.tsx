"use client"
import { useActionState, useEffect, useState, Suspense } from "react";
import { Loader2, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Login } from "@/utils/handlers";
import { getSession } from "@/utils/session";

function LoginForm() {
    const [state, action, pending] = useActionState(Login, {
        success: false,
        message: "",
        fieldErrors: {},
        values: { email: "" }
    });
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const redirectTo = searchParams.get("to") || "/profile";

    useEffect(() => {
        if (state?.success) {
            router.push(redirectTo);
            router.refresh();
        }
        getSession().then(data => {
            if ( data ) {
                router.push(redirectTo);
            }
        })
    }, [state, router, redirectTo]);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <form
            className="w-full max-w-md mx-auto bg-white rounded-2xl p-8 shadow-lg text-gray-900"
            action={action}
        >
            <h1 className="text-3xl font-bold mb-4 select-none">Вход в систему</h1>
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <div className="mb-2">
                <label htmlFor="email" className="block mb-1 font-medium text-sm">
                    Почта
                </label>
                <input
                    type="text"
                    autoComplete="email"
                    id="email"
                    name="email"
                    defaultValue={state.values?.email ?? ""}
                    className="shadow-lg w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring focus:ring-blue-400 focus:border-blue-400 outline-none transition-all placeholder-gray-400"
                    placeholder="test@test.com"
                />
                {state?.fieldErrors?.email && (
                    <p className="text-red-400 text-sm mt-2">{state.fieldErrors.email}</p>
                )}
            </div>

            <div className="mb-2">
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
                        placeholder="🞄🞄🞄🞄🞄🞄🞄🞄"
                    />
                    {state?.fieldErrors?.password && (
                        <p className="text-red-400 text-sm mt-2">{state.fieldErrors.password}</p>
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
                        href="https://t.me/rodiongoshev"
                        className="text-blue-400 hover:text-blue-500 transition-colors"
                    >
                        Забыли пароль?
                    </Link>
                </div>
            </div>

            {state?.message && (
                <p className="text-red-400 text-sm mb-2">{state.message}</p>
            )}

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
                <p className="text-gray-600 flex items-center gap-2">
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
    );
}

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center h-full">
            <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-blue-400" />}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
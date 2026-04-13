"use client"
import { useActionState, useEffect, useState, Suspense } from "react";
import { Loader2, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Login } from "@/utils/handlers";
import { getSession } from "@/utils/session";

function LoginForm() {
    // Используем useActionState для авторизации
    const [state, action, pending] = useActionState(Login, {
        success: false,
        message: "",
        fieldErrors: {},
        values: { email: "" }
    });
    // Используем useState для показа пароля
    const [showPassword, setShowPassword] = useState(false);
    // Используем useSearchParams для получения параметров
    const searchParams = useSearchParams();

    // Получаем параметр redirectTo
    const redirectTo = searchParams.get("to") || "/profile";

    // Используем useEffect для перенаправления после авторизации
    useEffect(() => {
        // Проверяем, что пользователь успешно авторизован
        if (state?.success) {
            // Перенаправляем пользователя на страницу профиля
            window.location.assign(redirectTo);
            return;
        }
        // Получаем сессию
        getSession().then(data => {
            // Проверяем, что сессия не пустая
            if ( data ) {
                // Перенаправляем пользователя на страницу профиля
                window.location.assign(redirectTo);
            }
        })
    }, [state, redirectTo]);

    // Функция для показа/скрытия пароля
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <form
            className="auth-card"
            action={action}
        >
            <h1 className="text-3xl font-bold mb-4 select-none">Авторизация</h1>
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <div className="mb-2">
                <label htmlFor="email" className="form-label">
                    Почта
                </label>
                <input
                    type="text"
                    autoComplete="email"
                    id="email"
                    name="email"
                    defaultValue={state.values?.email ?? ""}
                    className="auth-input"
                    placeholder="test@test.com"
                />
                {state?.fieldErrors?.email && (
                    <p className="text-red-400 text-sm mt-2">{state.fieldErrors.email}</p>
                )}
            </div>

            <div className="mb-6">
                <label htmlFor="password" className="form-label">
                    Пароль
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        id="password"
                        name="password"
                        className="auth-input"
                        placeholder="********"
                    />
                    {state?.fieldErrors?.password && (
                        <p className="text-red-400 text-sm mt-2">{state.fieldErrors.password}</p>
                    )}
                </div>
                <div className="flex justify-between items-center mt-2 text-sm">
                    <label className="flex items-center gap-2 select-none">
                        <input
                            id="show-password"
                            type="checkbox"
                            className="h-4 w-4 text-blue-400 focus:ring-blue-400 border-gray-300 dark:bg-neutral-600 rounded"
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
                className="auth-submit"
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
                <p className="text-muted-foreground flex items-center gap-2">
                    Впервые здесь?
                    <Link
                        href="/register"
                        className="text-blue-400 hover:text-blue-500 flex items-center gap-2 transition-colors"
                    >
                        Зарегистрируйтесь
                        <UserPlusIcon className="h-4 w-4" />
                    </Link>
                </p>
            </div>
        </form>
    );
}

export default function LoginPage() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center">
            <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-blue-400" />}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
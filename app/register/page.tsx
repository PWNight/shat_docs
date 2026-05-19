"use client"
import { useActionState, useEffect, useState, Suspense } from "react";
import { Loader2, User } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {Register} from "@/utils/handlers";
import { getSession } from "@/utils/session.client";

function isSafeRedirect(url: string): boolean {
    try {
        const parsed = new URL(url, window.location.origin);
        return parsed.origin === window.location.origin && parsed.pathname.startsWith("/");
    } catch {
        return url.startsWith("/") && !url.startsWith("//");
    }
}

function RegisterForm() {
    const [state, action, pending] = useActionState(Register, {
        success: false,
        message: "",
        fieldErrors: {},  
        values: { email: "" }
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [confirmError, setConfirmError] = useState("");
    const searchParams = useSearchParams();
    const rawRedirect = searchParams.get("to") || "/profile";
    const redirectTo = isSafeRedirect(rawRedirect) ? rawRedirect : "/profile";
    useEffect(() => {
        if (state?.success) {
            if (state.requiresApproval) {
                return;
            }
            setIsRedirecting(true);
            window.location.assign(redirectTo);
            return;
        }
        getSession().then(data => {
            if (data) {
                setIsRedirecting(true);
                window.location.assign(redirectTo);
            }
        });
    }, [state, redirectTo]);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    if (isRedirecting) {
        return (
            <div className="auth-card flex flex-col items-center justify-center gap-4 py-12">
                <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
                <p className="text-muted-foreground text-sm">Перенаправление...</p>
            </div>
        );
    }

    return (
        <form
            className="auth-card"
            action={action}
        >
            <h1 className="text-3xl font-bold mb-4 select-none">Регистрация</h1>

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
                    placeholder="name@example.com"
                />
                {state?.fieldErrors?.email && (
                    <p className="text-red-400 text-sm mt-2">{state.fieldErrors.email}</p>
                )}
            </div>

            <div className="mb-2">
                <label htmlFor="full_name" className="form-label">
                    ФИО
                </label>
                <input
                    type="text"
                    autoComplete="name"
                    id="full_name"
                    name="full_name"
                    defaultValue={state.values?.full_name ?? ""}
                    className="auth-input"
                    placeholder="Иванов И.И."
                />
                {state?.fieldErrors?.full_name && (
                    <p className="text-red-400 text-sm mt-2">{state.fieldErrors.full_name}</p>
                )}
            </div>

            <div className="mb-2">
                <label htmlFor="password" className="form-label">
                    Пароль
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        id="password"
                        name="password"
                        className="auth-input"
                        placeholder="********"
                    />
                    {state?.fieldErrors?.password && (
                        <p className="text-red-400 text-sm mt-2">{state.fieldErrors.password}</p>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <label htmlFor="confirmPassword" className="form-label">
                    Подтвердите пароль
                </label>
                <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    id="confirmPassword"
                    className="auth-input"
                    placeholder="********"
                    value={confirmPassword}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setConfirmError("");
                    }}
                />
                {confirmError && (
                    <p className="text-red-400 text-sm mt-2">{confirmError}</p>
                )}
                <div className="flex justify-between items-center mt-2 text-sm">
                    <label className="flex items-center gap-2 select-none">
                        <input
                            id="show-password"
                            type="checkbox"
                            className="h-4 w-4 text-blue-400 focus:ring-blue-400 border-gray-200 rounded"
                            onChange={togglePasswordVisibility}
                        />
                        Показать пароль
                    </label>
                </div>
            </div>

            {state?.message && (
                <p className={`${state.requiresApproval ? "text-emerald-500" : "text-red-400"} text-sm mb-2`}>{state.message}</p>
            )}

            <button
                type="submit"
                className="auth-submit"
                disabled={pending}
                onClick={(e) => {
                    const form = (e.target as HTMLElement).closest("form");
                    const passwordInput = form?.querySelector<HTMLInputElement>("#password");
                    if (passwordInput && passwordInput.value !== confirmPassword) {
                        e.preventDefault();
                        setConfirmError("Пароли не совпадают");
                    }
                }}
            >
                {pending ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Регистрация...
                    </>
                ) : (
                    "Зарегистрироваться"
                )}
            </button>
            <div className="mt-4 text-sm">
                <p className="text-muted-foreground flex items-center gap-2">
                    Уже есть аккаунт?
                    <Link
                        href="/login"
                        className="text-blue-400 hover:text-blue-500 flex items-center gap-2 transition-colors"
                    >
                        Авторизуйтесь
                        <User className="h-4 w-4" />
                    </Link>
                </p>
            </div>
        </form>
    );
}

export default function RegisterPage() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center">
            <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-blue-400" />}>
                <RegisterForm />
            </Suspense>
        </div>
    );
}
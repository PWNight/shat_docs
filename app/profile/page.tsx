"use client"
import React, {useCallback, useEffect, useState} from "react";
import {GetUser, UpdateProfile} from "@/utils/handlers";
import {useRouter} from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { getSession } from "@/utils/session";
import {
    ShieldCheck, Save, Loader2,
    Info, CalendarDays, Fingerprint,
    UserCheck, AtSign
} from "lucide-react";
import ErrorMessage from "@/components/NotifyAlert";
import PageErrorState from "@/components/ui/PageErrorState";
import { getDbOfflineToastMessage, getErrorKindByMeta, isDbOfflineMeta } from "@/utils/ui-errors";
import { ApiResponseError } from "@/utils/functions";
import {
    InfoItemProps,
    Notify,
    ProfileInputProps, SubmitButtonProps,
    TabButtonProps,
    ActiveSession,
    UpdateProfileFormData,
    UserProfile
} from "@/utils/interfaces";
import { apiDelete, apiGet, apiPost } from "@/utils/http-client";
import Loader from "@/components/ui/animations/Loader";
import PaginationControls from "@/components/ui/PaginationControls";
import { ScrollArea } from "@/components/ui/ScrollArea";

// Типы вкладок
type TabType = 'name' | 'email' | 'password';

export default function ProfilePage() {
    // Получаем router
    const router = useRouter();

    // Состояния
    const [user, setUser] = useState<UserProfile | null>(null); // Данные пользователя
    const [loading, setLoading] = useState(true); // Загрузка
    const [activeTab, setActiveTab] = useState<TabType>("name"); // Выбранная вкладка
    const [notify, setNotify] = useState<Notify>({ message: "", type: "" }); // Уведомления
    const [pending, setPending] = useState(false); // Загрузка
    const [pageError, setPageError] = useState<{ message: string; status?: number; code?: string } | null>(null); // Ошибка
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [sessionPage, setSessionPage] = useState(1);
    const SESSIONS_PER_PAGE = 9;

    // Функция для загрузки данных
    const loadData = useCallback(async (userId: number) => {
        // Получаем данные пользователя и статистики
        const [userResponse, sessionsResponse] = await Promise.allSettled([
            // Получаем данные пользователя
            GetUser(userId),
            apiGet<{ data?: ActiveSession[] }>("/api/sessions"),
        ]);

        // Ошибка
        let fatalError: { message: string; status?: number; code?: string } | null = null;
        // Проверяем, что данные пользователя не пустые
        if (userResponse.status === "fulfilled" && userResponse.value.success && "data" in userResponse.value && userResponse.value.data) {
            // Устанавливаем данные пользователя
            setUser((userResponse.value.data ?? null) as UserProfile | null);
        } else {
            if (userResponse.status === "fulfilled") {
                // Получаем значение
                const value = userResponse.value;
                // Устанавливаем ошибку
                fatalError = {
                    // Устанавливаем сообщение
                    message: value.message || "Ошибка загрузки данных",
                    status: value.success === false ? value.status : undefined,
                    code: value.success === false ? value.code : undefined,
                };
            }
        }

        if (sessionsResponse.status === "fulfilled" && "data" in sessionsResponse.value) {
            setSessions(sessionsResponse.value.data ?? []);
        } else {
            setNotify({ message: "Не удалось загрузить список устройств", type: "warning" });
        }

        // Проверяем, что ошибка не пустая
        if (fatalError) {
            // Устанавливаем ошибку
            setPageError(fatalError);
        }
    }, []);

    // Используем useEffect для загрузки данных
    useEffect(() => {
        // Создаем флаг для отслеживания монтирования
        let isMounted = true;

        // Пытаемся получить сессию
        getSession().then(async (session) => {
            // Проверяем, что компонент не размонтирован
            if (!isMounted) return;

            // Проверяем, что сессия не пустая
            if (!session) {
                router.push("/login?to=profile");
                return;
            }

            // Загружаем данные
            await loadData(session.uid);
            // Устанавливаем загрузку
            setLoading(false);
        });

        // Возвращаем функцию для отслеживания размонтирования
        return () => {
            isMounted = false;
        };
    }, [router, loadData]);

    const paginatedSessions = sessions.slice((sessionPage - 1) * SESSIONS_PER_PAGE, sessionPage * SESSIONS_PER_PAGE);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(sessions.length / SESSIONS_PER_PAGE));
        if (sessionPage > totalPages) setSessionPage(totalPages);
    }, [sessionPage, sessions.length]);

    // Функция для обработки действия
    const handleAction = async (e: React.ChangeEvent<HTMLFormElement>) => {
        // Предотвращаем стандартное поведение формы
        e.preventDefault();
        // Устанавливаем загрузку
        setPending(true);

        // Получаем данные формы
        const formData = new FormData(e.currentTarget);
        // Преобразуем данные формы в объект
        const data = Object.fromEntries(formData) as UpdateProfileFormData;

        // Выполняем запрос на обновление профиля
        const res = await UpdateProfile(data) as { success: boolean; message?: string };

        // Устанавливаем уведомление
        setNotify({
            message: res.message || (res.success ? "Сохранено" : "Ошибка сохранения"),
            type: res.success ? 'success' : 'error'
        });

        // Проверяем, что запрос успешен
        if (res.success) {
            if (data.full_name || data.email) {
                // Устанавливаем данные пользователя
                setUser((prev) => {
                    // Проверяем, что данные не пустые
                    if (!prev) return null;

                    return {
                        ...prev,
                        full_name: data.full_name ?? prev.full_name,
                        email: data.email ?? prev.email,
                    };
                });
            }

            // Проверяем, что выбрана вкладка пароля
            if (activeTab === "password") {
                // Сбрасываем форму
                (e.target as HTMLFormElement).reset();
            }
        }

        // Устанавливаем загрузку
        setPending(false);
    };

    const revokeSession = async (sessionId: string) => {
        setPending(true);
        try {
            await apiDelete(`/api/sessions/${sessionId}`);
            const refreshed = await apiGet<{ data?: ActiveSession[] }>("/api/sessions");
            setSessions(refreshed.data ?? []);
            setNotify({ message: "Сессия отозвана", type: "success" });
        } catch (error) {
            setNotify({ message: error instanceof Error ? error.message : "Не удалось отозвать сессию", type: "error" });
        } finally {
            setPending(false);
        }
    };

    // Функция для обработки запроса сброса пароля
    const handlePasswordResetRequest = async () => {
        // Устанавливаем загрузку
        setPending(true);
        // Пытаемся получить ответ от сервера
        try {
            // Выполняем POST запрос на запрос сброса пароля
            const response = await apiPost<{ message?: string }>("/api/password-resets");
            // Устанавливаем уведомление
            setNotify({ message: response.message || "Заявка отправлена", type: "success" });
        } catch (error) {
            // Проверяем, что ошибка является ApiResponseError
            if (error instanceof ApiResponseError) {
                // Проверяем, что ошибка является ошибкой базы данных
                const dbOffline = isDbOfflineMeta(error.status, error.code);
                // Устанавливаем уведомление
                setNotify({
                    message: dbOffline ? getDbOfflineToastMessage() : error.message,
                    type: dbOffline ? "warning" : "error",
                });
                return;
            }
            // Устанавливаем уведомление
            setNotify({ message: error instanceof Error ? error.message : "Ошибка отправки заявки", type: "error" });
        } finally {
            // Устанавливаем загрузку
            setPending(false);
        }
    };

    // Возвращаем заглушку загрузки, пока данные не готовы
    if (loading) {
        return (
            <Loader/>
        );
    }

    // Проверяем, что ошибка не пустая
    if (pageError) {
        // Получаем тип ошибки
        const kind = getErrorKindByMeta(pageError.status, pageError.code);
        return (
            <PageErrorState
                kind={kind}
                title={kind === "db" ? "Нет подключения к базе данных" : "Не удалось загрузить данные профиля"}
                description={kind === "db" ? "Проверьте доступность БД и повторите попытку." : undefined}
                details={pageError.message}
                onAction={() => window.location.reload()}
            />
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {notify.message && (
                <ErrorMessage 
                    message={notify.message} 
                    type={notify.type} 
                    onClose={() => setNotify({message:'', type:''})} 
                />
            )}

            <header className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-blue-500/5 to-transparent" />
                <div className="relative p-6 sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-2 min-w-0">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-muted-foreground">
                                Личный кабинет
                            </p>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground truncate">
                                {user?.full_name || "Профиль"}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-800/70 px-3 py-1.5 font-semibold text-gray-600 dark:text-gray-300">
                                    <Fingerprint className="h-4 w-4" />
                                    ID: {user?.id}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-800/70 px-3 py-1.5 font-semibold text-gray-600 dark:text-gray-300">
                                    <CalendarDays className="h-4 w-4" />
                                    Регистрация: {user?.created_by ? new Date(user.created_by).toLocaleDateString() : "—"}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handlePasswordResetRequest}
                                disabled={pending}
                                className="rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 hover:bg-red-500/80 hover:text-white px-5 py-3 text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                Сбросить пароль
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                <main className="lg:col-span-7 space-y-6">
                    <section className="group relative bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm">
                        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-blue-500/5 to-transparent" />
                        <div className="relative p-2 sm:p-3 border-b border-border bg-muted/20">
                            <div className="flex p-1.5 bg-background/60 rounded-2xl border border-border w-fit">
                                {(['name', 'email', 'password'] as TabType[]).map((tab) => (
                                    <TabButton
                                        key={tab}
                                        active={activeTab === tab}
                                        onClick={() => setActiveTab(tab)}
                                        label={tab === 'name' ? 'Имя' : tab === 'email' ? 'Почта' : 'Пароль'}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="relative p-6 sm:p-8">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <form onSubmit={handleAction} className="space-y-8">
                                        <header className="space-y-1">
                                            <h2 className="text-2xl font-extrabold tracking-tight">
                                                {activeTab === 'name' && "Личные данные"}
                                                {activeTab === 'email' && "Контактная почта"}
                                                {activeTab === 'password' && "Безопасность"}
                                            </h2>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {activeTab === 'name' && "Эти данные используются в отчетах и ведомостях."}
                                                {activeTab === 'email' && "Email используется для входа и восстановления доступа."}
                                                {activeTab === 'password' && "Рекомендуем менять пароль раз в несколько месяцев."}
                                            </p>
                                        </header>

                                        <div className="space-y-6">
                                            {activeTab === 'name' && (
                                                <ProfileInput name="full_name" label="Новое ФИО" defaultValue={user?.full_name} placeholder="Иванов Иван Иванович" />
                                            )}
                                            {activeTab === 'email' && (
                                                <ProfileInput name="email" label="Новый Email" type="email" defaultValue={user?.email} />
                                            )}
                                            {activeTab === 'password' && (
                                                <>
                                                    <ProfileInput name="currentPassword" label="Текущий пароль" type="password" required />
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                        <ProfileInput name="newPassword" label="Новый пароль" type="password" required />
                                                        <ProfileInput name="confirmPassword" label="Подтверждение" type="password" required />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <SubmitButton pending={pending} />
                                    </form>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </section>
                </main>

                <aside className="lg:col-span-5 space-y-6">
                    <section className="group relative bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm overflow-hidden">
                        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-blue-500/5 to-transparent" />
                        <h3 className="text-xs font-extrabold text-muted-foreground uppercase mb-6 flex items-center gap-2 tracking-widest">
                            <Info className="w-4 h-4 text-primary" /> Быстрая сводка
                        </h3>
                        <div className="space-y-6 relative">
                            <InfoItem label="Полное имя" value={user?.full_name} icon={<UserCheck />} iconColor="text-blue-500" bgColor="bg-blue-50/80 dark:bg-blue-500/10" />
                            <InfoItem label="Email адрес" value={user?.email} icon={<AtSign />} iconColor="text-emerald-500" bgColor="bg-emerald-50/80 dark:bg-emerald-500/10" />
                            <InfoItem label="Регистрация" value={user?.created_by ? new Date(user.created_by).toLocaleDateString() : '—'} icon={<CalendarDays />} iconColor="text-orange-500" bgColor="bg-orange-50/80 dark:bg-orange-500/10" />
                        </div>
                    </section>

                    <section className="max-h-[600px] group relative bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col min-h-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm overflow-hidden">
                        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-blue-500/5 to-transparent" />
                        <header className="space-y-1 relative">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-xl font-extrabold tracking-tight">Активные сессии</h3>
                                <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-border bg-muted/20 text-muted-foreground">
                                    {sessions.length}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium">Устройства, имеющие доступ к аккаунту.</p>
                        </header>

                        <div className="mt-5 flex-1 min-h-0 relative">
                            {sessions.length === 0 ? (
                                <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl text-muted-foreground text-sm">
                                    Активные сессии не найдены
                                </div>
                            ) : (
                                <ScrollArea className="h-[520px] lg:h-[560px] pr-2">
                                    <div className="grid gap-2.5">
                                        {paginatedSessions.map((session) => (
                                            <div
                                                key={session.sessionId}
                                                className="break-all group relative overflow-hidden border border-border rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-300 bg-background/40 hover:bg-background/60 hover:shadow-md"
                                            >
                                                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none bg-gradient-to-br from-blue-500/5 to-transparent" />
                                                <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
                                                    <div className={`p-2.5 rounded-xl ${session.isCurrent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                        <ShieldCheck size={18} />
                                                    </div>
                                                    <div className="text-sm min-w-0">
                                                        <p className="font-bold flex items-center gap-2 min-w-0">
                                                            <span className="truncate">{session.deviceLabel}</span>
                                                            {session.isCurrent && (
                                                                <span className="shrink-0 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                                    Текущая
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-muted-foreground text-xs font-medium ">
                                                            {session.ipAddress} • {new Date(session.lastSeenAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                {!session.isCurrent && (
                                                    <button
                                                        disabled={pending}
                                                        onClick={() => revokeSession(session.sessionId)}
                                                        className="w-full sm:w-auto rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 hover:bg-red-500/80 hover:text-white px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 relative"
                                                    >
                                                        Завершить
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>

                        <div className="pt-4">
                            <PaginationControls
                                currentPage={sessionPage}
                                totalItems={sessions.length}
                                itemsPerPage={SESSIONS_PER_PAGE}
                                onPageChange={setSessionPage}
                            />
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

const InfoItem = ({ label, value, icon, iconColor, bgColor }: InfoItemProps) => (
    <div className="flex items-center gap-4 group">
        <div className={`${bgColor} ${iconColor} p-3.5 rounded-2xl shrink-0 transition-transform group-hover:scale-105 border border-border/50`}>
            {React.cloneElement(icon, { size: 20 })}
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1.5">{label}</p>
            <p className="text-[15px] font-bold text-foreground truncate leading-none">{value}</p>
        </div>
    </div>
);

const TabButton = ({ active, onClick, label }: TabButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        className={`relative px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex-1 sm:flex-none sm:w-32 z-10 ${
            active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
    >
        {active && (
            <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-card border border-border rounded-xl shadow-sm -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            />
        )}
        {label}
    </button>
);

const ProfileInput = ({ label, ...props }: ProfileInputProps) => (
    <div className="space-y-2">
        <label className="text-[12px] font-bold ml-1 uppercase tracking-widest text-muted-foreground/80">{label}</label>
        <input
            {...props}
            className="w-full px-5 py-3.5 bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl outline-none transition-all text-sm font-semibold text-foreground shadow-sm placeholder:text-muted-foreground/50"
        />
    </div>
);

const SubmitButton = ({ pending }: SubmitButtonProps) => (
    <button
        disabled={pending}
        type="submit"
        className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-4 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-md mt-4"
    >
        {pending ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>}
        Сохранить изменения
    </button>
);
"use client"
import React, {useCallback, useEffect, useState} from "react";
import {GetTeacherStats, GetUser, UpdateProfile} from "@/utils/handlers";
import {useRouter} from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { getSession } from "@/utils/session";
import {
    BarChart3, Users,
    GraduationCap, ShieldCheck, Save, Loader2,
    Info, CalendarDays, Fingerprint,
    UserCheck, AtSign
} from "lucide-react";
import ErrorMessage from "@/components/NotifyAlert";
import {
    InfoItemProps,
    Notify,
    ProfileInputProps, StatCardProps, SubmitButtonProps,
    TabButtonProps,
    TeacherStats,
    UpdateProfileFormData,
    UserProfile
} from "@/utils/interfaces";
import { apiPost } from "@/utils/http-client";

type TabType = 'name' | 'email' | 'password';

export default function ProfilePage() {
    const router = useRouter();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<TeacherStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("name");
    const [notify, setNotify] = useState<Notify>({ message: "", type: "" });
    const [pending, setPending] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);

    const loadData = useCallback(async (userId: number) => {
        const [userResponse, statsResponse] = await Promise.allSettled([
            GetUser(userId),
            GetTeacherStats(),
        ]);

        let hasFatalError = false;
        if (userResponse.status === "fulfilled" && userResponse.value.success && "data" in userResponse.value) {
            setUser((userResponse.value.data ?? null) as UserProfile | null);
        } else {
            hasFatalError = true;
        }

        if (statsResponse.status === "fulfilled" && statsResponse.value.success && "data" in statsResponse.value) {
            setStats((statsResponse.value.data ?? null) as TeacherStats | null);
        } else {
            setNotify({ message: "Не удалось загрузить статистику, показываем профиль без нее", type: "warning" });
        }

        if (hasFatalError) {
            setPageError("Не удалось загрузить данные профиля");
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        getSession().then(async (session) => {
            if (!isMounted) return;

            if (!session) {
                router.push("/login?to=profile");
                return;
            }

            await loadData(session.uid);
            setLoading(false);
        });

        return () => {
            isMounted = false;
        };
    }, [router, loadData]);

    const handleAction = async (e: React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPending(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData) as UpdateProfileFormData;

        const res = await UpdateProfile(data) as { success: boolean; message?: string };

        setNotify({
            message: res.message || (res.success ? "Сохранено" : "Ошибка сохранения"),
            type: res.success ? 'success' : 'error'
        });

        if (res.success) {
            if (data.full_name || data.email) {
                setUser((prev) => {
                    if (!prev) return null;

                    return {
                        ...prev,
                        full_name: data.full_name ?? prev.full_name,
                        email: data.email ?? prev.email,
                    };
                });
            }

            if (activeTab === "password") {
                (e.target as HTMLFormElement).reset();
            }
        }

        setPending(false);
    };

    const handlePasswordResetRequest = async () => {
        setPending(true);
        try {
            const response = await apiPost<{ message?: string }>("/api/v2/password-resets/request");
            setNotify({ message: response.message || "Заявка отправлена", type: "success" });
        } catch (error) {
            setNotify({ message: error instanceof Error ? error.message : "Ошибка отправки заявки", type: "error" });
        } finally {
            setPending(false);
        }
    };

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <Loader2 className="animate-spin text-primary w-10 h-10" />
        </div>
    );

    if (pageError) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <p className="text-lg font-semibold">{pageError}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                    Повторить загрузку
                </button>
            </div>
        );
    }

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-500 bg-background min-h-screen">
            {notify.message && <ErrorMessage message={notify.message} type={notify.type} onClose={() => setNotify({message:'', type:''})} />}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Личный кабинет</h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Управление профилем и обзор статистики групп</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePasswordResetRequest}
                        className="rounded-xl bg-orange-600 px-4 py-2 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-60"
                        disabled={pending}
                    >
                        Запросить сброс пароля
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-2xl shadow-sm self-start md:self-center">
                        <Fingerprint className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">ID: {user?.id}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Users />}
                    label="Студентов"
                    value={stats?.students ?? 0}
                    color="text-blue-600 dark:text-blue-400"
                    bgColor="bg-blue-50 dark:bg-blue-900/30"
                    borderColor="border-blue-200 dark:border-blue-900/50"
                />
                <StatCard
                    icon={<GraduationCap />}
                    label="Средний балл"
                    value={stats?.avgGrade ?? "—"}
                    color="text-purple-600 dark:text-purple-400"
                    bgColor="bg-purple-50 dark:bg-purple-900/30"
                    borderColor="border-purple-200 dark:border-purple-900/50"
                />
                <StatCard
                    icon={<BarChart3 />}
                    label="Посещаемость"
                    value={stats?.attendance?.percent != null ? `${stats.attendance.percent}%` : "—"}
                    color="text-emerald-600 dark:text-emerald-400"
                    bgColor="bg-emerald-50 dark:bg-emerald-900/30"
                    borderColor="border-emerald-200 dark:border-emerald-900/50"
                />
                <StatCard
                    icon={<ShieldCheck />}
                    label="Опоздания"
                    value={stats?.attendance?.late ?? 0}
                    color="text-orange-600 dark:text-orange-400"
                    bgColor="bg-orange-50 dark:bg-orange-900/30"
                    borderColor="border-orange-200 dark:border-orange-900/50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <aside className="lg:col-span-4 space-y-6">
                    <section className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                        <h3 className="text-sm font-bold text-foreground uppercase mb-8 flex items-center gap-2">
                            <Info className="w-4 h-4 text-primary" /> Информация
                        </h3>
                        <div className="space-y-8">
                            <InfoItem label="Полное имя" value={user?.full_name} icon={<UserCheck />} iconColor="text-blue-500" bgColor="bg-blue-50/80 dark:bg-blue-500/10" />
                            <InfoItem label="Email адрес" value={user?.email} icon={<AtSign />} iconColor="text-emerald-500" bgColor="bg-emerald-50/80 dark:bg-emerald-500/10" />
                            <InfoItem label="Регистрация" value={user?.created_by ? new Date(user.created_by).toLocaleDateString() : '—'} icon={<CalendarDays />} iconColor="text-orange-500" bgColor="bg-orange-50/80 dark:bg-orange-500/10" />
                        </div>
                    </section>
                </aside>

                <main className="lg:col-span-8 space-y-6 lg:max-w-2xl">
                    <div className="flex p-1.5 bg-card rounded-2xl border border-border w-full sm:w-fit shadow-inner relative overflow-hidden">
                        <TabButton active={activeTab === 'name'} onClick={() => setActiveTab('name')} label="Имя" />
                        <TabButton active={activeTab === 'email'} onClick={() => setActiveTab('email')} label="Почта" />
                        <TabButton active={activeTab === 'password'} onClick={() => setActiveTab('password')} label="Пароль" />
                    </div>

                    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm overflow-hidden min-h-75">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                            >
                                {activeTab === 'name' && (
                                    <form onSubmit={handleAction} className="space-y-8">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold text-foreground">Личные данные</h3>
                                            <p className="text-sm text-muted-foreground">Обновите ваше ФИО для корректного отображения в документах</p>
                                        </div>
                                        <ProfileInput name="full_name" label="Новое ФИО" defaultValue={user?.full_name} placeholder="Введите ваше имя" />
                                        <SubmitButton pending={pending} />
                                    </form>
                                )}

                                {activeTab === 'email' && (
                                    <form onSubmit={handleAction} className="space-y-8">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold text-foreground">Контактная почта</h3>
                                            <p className="text-sm text-muted-foreground">Адрес электронной почты для входа и уведомлений</p>
                                        </div>
                                        <ProfileInput name="email" label="Новый Email" type="email" defaultValue={user?.email} placeholder="example@domain.com" />
                                        <SubmitButton pending={pending} />
                                    </form>
                                )}

                                {activeTab === 'password' && (
                                    <form onSubmit={handleAction} className="space-y-8">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold text-foreground">Смена пароля</h3>
                                            <p className="text-sm text-muted-foreground">Секретная фраза, благодаря которой вы входите в аккаунт</p>
                                        </div>
                                        <ProfileInput name="currentPassword" label="Текущий пароль" type="password" required />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <ProfileInput name="newPassword" label="Новый пароль" type="password" required />
                                            <ProfileInput name="confirmPassword" label="Подтверждение" type="password" required />
                                        </div>
                                        <SubmitButton pending={pending} />
                                    </form>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
}

// Вспомогательные компоненты
const StatCard = ({ icon, label, value, color, bgColor, borderColor }: StatCardProps) => (
    <div className={`bg-card p-5 rounded-2xl border ${borderColor} shadow-sm hover:shadow-md transition-all duration-300 group`}>
        <div className={`${bgColor} ${color} w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
            {React.cloneElement(icon, { size: 20, strokeWidth: 2.5 })}
        </div>
        <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1 tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-foreground leading-none">{value || 0}</p>
        </div>
    </div>
);

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
        className={`relative px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 w-full sm:w-32 z-10 ${
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
        className="w-full sm:w-auto bg-primary hover:bg-neutral-800 dark:bg-neutral-700 hover:dark:bg-neutral-600 text-primary-foreground px-4 py-4 rounded-2xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-md mt-4"
    >
        {pending ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>}
        Сохранить изменения
    </button>
);
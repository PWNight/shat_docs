"use client"
import React, {useCallback, useEffect, useState} from "react";
import {GetTeacherStats, GetUser, UpdateProfile} from "@/utils/handlers";
import {useRouter} from "next/navigation";

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

type TabType = 'name' | 'email' | 'password';

export default function ProfilePage() {
    const router = useRouter();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<TeacherStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("name");
    const [notify, setNotify] = useState<Notify>({ message: "", type: "" });
    const [pending, setPending] = useState(false);

    const loadData = useCallback(async () => {
        const response = await GetTeacherStats();
        if (!response.success) {
            setNotify({ message: response.message || "Ошибка загрузки статистики", type: 'error' });
        } else {
            setStats(response.data);
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

            const response = await GetUser(session.uid);
            setUser(response.data)

            await loadData();
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

        // Вызываем новый объединенный обработчик
        const res = await UpdateProfile(data);

        setNotify({
            message: res.message,
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

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
        </div>
    );

    return (
        <div className="max-w-6xl space-y-8 animate-in fade-in duration-500">
            {notify.message && <ErrorMessage message={notify.message} type={notify.type} onClose={() => setNotify({message:'', type:''})} />}

            <div className="sm:text-left text-center flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Личный кабинет</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">Управление профилем и обзор статистики групп</p>
                </div>
                <div className="sm:mx-0 mx-auto flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm self-start md:self-center">
                    <Fingerprint className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">ID: {user?.id}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Users />}
                    label="Студентов"
                    value={stats?.students ?? 0}
                    color="text-blue-600"
                    bgColor="bg-blue-50 dark:bg-blue-900/20"
                    borderColor="border-blue-100 dark:border-blue-900/30"
                />
                <StatCard
                    icon={<GraduationCap />}
                    label="Средний балл"
                    value={stats?.avgGrade ?? "—"}
                    color="text-purple-600"
                    bgColor="bg-purple-50 dark:bg-purple-900/20"
                    borderColor="border-purple-100 dark:border-purple-900/30"
                />
                <StatCard
                    icon={<BarChart3 />}
                    label="Посещаемость"
                    value={stats?.attendance?.percent != null ? `${stats.attendance.percent}%` : "—"}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50 dark:bg-emerald-900/20"
                    borderColor="border-emerald-100 dark:border-emerald-900/30"
                />
                <StatCard
                    icon={<ShieldCheck />}
                    label="Опоздания"
                    value={stats?.attendance?.late ?? 0}
                    color="text-orange-600"
                    bgColor="bg-orange-50 dark:bg-orange-900/20"
                    borderColor="border-orange-100 dark:border-orange-900/30"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <aside className="lg:col-span-4 space-y-6">
                    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
                        <h2 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                            <Info className="w-4 h-4" /> Информация
                        </h2>
                        <div className="space-y-8">
                            <InfoItem label="Полное имя" value={user?.full_name} icon={<UserCheck />} iconColor="text-blue-500" bgColor="bg-blue-50/50 dark:bg-blue-500/10" />
                            <InfoItem label="Email адрес" value={user?.email} icon={<AtSign />} iconColor="text-emerald-500" bgColor="bg-emerald-50/50 dark:bg-emerald-500/10" />
                            <InfoItem label="Регистрация" value={user?.created_by ? new Date(user.created_by).toLocaleDateString() : '—'} icon={<CalendarDays />} iconColor="text-orange-500" bgColor="bg-orange-50/50 dark:bg-orange-500/10" />
                        </div>
                    </section>
                </aside>

                <main className="lg:col-span-8 space-y-6">
                    <div className="flex p-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full sm:w-fit">
                        <TabButton active={activeTab === 'name'} onClick={() => setActiveTab('name')} label="Имя" />
                        <TabButton active={activeTab === 'email'} onClick={() => setActiveTab('email')} label="Почта" />
                        <TabButton active={activeTab === 'password'} onClick={() => setActiveTab('password')} label="Пароль" />
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
                        {activeTab === 'name' && (
                            <form onSubmit={handleAction} className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Личные данные</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Обновите ваше ФИО для корректного отображения в документах</p>
                                </div>
                                <ProfileInput name="full_name" label="Новое ФИО" defaultValue={user?.full_name} placeholder="Введите ваше имя" />
                                <SubmitButton pending={pending} />
                            </form>
                        )}

                        {activeTab === 'email' && (
                            <form onSubmit={handleAction} className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Контактная почта</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Адрес электронной почты для входа и уведомлений</p>
                                </div>
                                <ProfileInput name="email" label="Новый Email" type="email" defaultValue={user?.email} placeholder="example@domain.com" />
                                <SubmitButton pending={pending} />
                            </form>
                        )}

                        {activeTab === 'password' && (
                            <form onSubmit={handleAction} className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Смена пароля</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Секретная фраза, благодаря которой вы входите в аккаунт</p>
                                </div>
                                <ProfileInput name="currentPassword" label="Текущий пароль" type="password" required />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <ProfileInput name="newPassword" label="Новый пароль" type="password" required />
                                    <ProfileInput name="confirmPassword" label="Подтверждение" type="password" required />
                                </div>
                                <SubmitButton pending={pending} />
                            </form>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

const StatCard = ({ icon, label, value, color, bgColor, borderColor }: StatCardProps) => (
    <div className={`bg-white dark:bg-zinc-900 p-5 rounded-xl border ${borderColor} shadow-sm hover:scale-[1.02] transition-all duration-300 group`}>
        <div className={`${bgColor} ${color} w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-3`}>
            {React.cloneElement(icon, { size: 20, strokeWidth: 2.5 })}
        </div>
        <div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 leading-none">{value || 0}</p>
        </div>
    </div>
);

const InfoItem = ({ label, value, icon, iconColor, bgColor }: InfoItemProps) => (
    <div className="flex items-center gap-4 group">
        <div className={`${bgColor} ${iconColor} p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110`}>
            {React.cloneElement(icon, { size: 20 })}
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1.5">{label}</p>
            <p className="text-[15px] font-bold text-zinc-700 dark:text-zinc-200 truncate leading-none">{value}</p>
        </div>
    </div>
);

const TabButton = ({ active, onClick, label }: TabButtonProps) => (
    <button
        onClick={onClick}
        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 w-full sm:w-32 ${
            active
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
        }`}
    >
        {label}
    </button>
);

const ProfileInput = ({ label, ...props }: ProfileInputProps) => (
    <div className="space-y-2">
        <label className="text-xs font-black text-zinc-400 dark:text-zinc-500 ml-1 uppercase tracking-widest">{label}</label>
        <input
            {...props}
            className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-700 focus:border-blue-500/50 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-zinc-900 rounded-2xl outline-none transition-all text-sm font-semibold dark:text-zinc-100 shadow-inner"
        />
    </div>
);

const SubmitButton = ({ pending, color = "bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 shadow-zinc-200 dark:shadow-none" }: SubmitButtonProps) => (
    <button
        disabled={pending}
        type="submit"
        className={`${color} text-white sm:px-8 sm:py-4 py-2 px-8 rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg mt-4`}
    >
        {pending ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>}
        Сохранить изменения
    </button>
);

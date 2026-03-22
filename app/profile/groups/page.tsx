"use client"
import React, {useActionState, useCallback, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {getSession} from "@/utils/session";
import {CreateGroup, GetAllGroups} from "@/utils/handlers";
import ErrorMessage from "@/components/NotifyAlert";
import {ArrowRight, Calendar, Loader2, Plus, SearchX, Users, UserStar} from "lucide-react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/Dialog";
import Link from "next/link";
import {GroupFormState} from "@/utils/definitions";
import {CreateFormProps, Group, Notify} from "@/utils/interfaces";

// Форма создания группы
const GroupCreateForm = ({ open, setOpen, dispatch, pending, state, userData }: CreateFormProps) => {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm active:scale-95">
                    <Plus className="w-5 h-5" />
                    Создать группу
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Новая группа</DialogTitle>
                </DialogHeader>
                <form action={dispatch} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Название группы
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder=""
                        />
                        <input type="hidden" name="fk_user" defaultValue={userData?.uid} />

                        {state?.fieldErrors?.name && (
                            <p className="text-red-500 text-xs font-medium">{state.fieldErrors.name}</p>
                        )}
                        {state?.fieldErrors?.fk_user && (
                            <p className="text-red-500 text-xs font-medium">{state.fieldErrors.fk_user}</p>
                        )}
                    </div>

                    {state?.message && !state.success && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                            {state.message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={pending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Создать группу"}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default function ProfileGroups() {
    const router = useRouter();

    const [userData, setUserData] = useState<{ email: string; uid: number }>(Object);
    const [groups, setGroups] = useState<Group[]>([]);
    const [pageLoaded, setPageLoaded] = useState(false);
    const [notify, setNotify] = useState<Notify>({ message: '', type: '' });
    const [open, setOpen] = useState(false);

    // Функция загрузки списка групп
    const loadData = useCallback(async () => {
        const response = await GetAllGroups();
        if (!response.success) {
            setNotify({ message: response.message || "Ошибка загрузки групп", type: 'error' });
        } else {
            setGroups(response.data || []);
        }
    }, []);

    // useActionState для создания группы
    const [state, dispatch, pending] = useActionState<GroupFormState, FormData>(
        async (prevState: GroupFormState, formData: FormData) => {
            const result = await CreateGroup(prevState, formData);

            if (result.success) {
                setOpen(false);
                setNotify({ message: "Группа успешно создана", type: "success" });
                await loadData();
            }

            return result;
        },
        { success: false, message: "", fieldErrors: {} }
    );

    // Инициализация при монтировании
    useEffect(() => {
        let isMounted = true;

        getSession().then(async (session) => {
            if (!isMounted) return;

            if (!session) {
                router.push("/login?to=profile/groups");
                return;
            }

            setUserData({ email: session.email, uid: session.uid });
            await loadData();
            setPageLoaded(true);
        });

        return () => {
            isMounted = false;
        };
    }, [router, loadData]);

    if (!pageLoaded) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className={'animate-in fade-in duration-500'}>
            {notify.message && (
                <ErrorMessage
                    message={notify.message}
                    type={notify.type}
                    onClose={() => setNotify({ message: '', type: '' })}
                />
            )}

            <div className="flex flex-col xl:flex-row xl:items-center items-start justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Группы
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-lg">
                        Управление учебными коллективами и участниками
                    </p>
                </div>

                <GroupCreateForm
                    open={open}
                    setOpen={setOpen}
                    dispatch={dispatch}
                    pending={pending}
                    state={state}
                    userData={userData}
                />
            </div>

            {groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 mb-8">
                    {groups.map((group: Group) => {
                        const isOwner = group.fk_user === userData?.uid;
                        return (
                            <div
                                key={group.id}
                                className="group relative flex flex-col p-6 rounded-2xl bg-card dark:bg-card border border-gray-100 dark:border-zinc-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="flex justify-between items-center xl:items-start gap-2 mb-4">
                                    <div className={`p-3 rounded-lg ${isOwner ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div className='flex gap-2'>
                                        {isOwner && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-blue-600 text-white rounded shadow-sm">
                                                Ваша группа
                                            </span>
                                        )}
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-gray-100 shadow-sm dark:bg-zinc-600 rounded dark:text-gray-300">
                                            ID: {group.id}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                                    {group.name}
                                </h3>

                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(group.created_by).toLocaleDateString("ru-RU", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>

                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6 gap-2">
                                    <UserStar className="w-4 h-4" />
                                    <span>{group.leader}</span>
                                </div>

                                <Link
                                    href={`/profile/groups/${group.id}`}
                                    className="shadow-sm mt-auto flex items-center justify-center gap-2 w-full bg-zinc-100 dark:bg-zinc-700/50 hover:bg-blue-600! hover:text-white text-gray-700 dark:text-gray-200 font-semibold py-3 rounded-xl transition-all"
                                >
                                    Управлять
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-gray-50 dark:bg-zinc-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-zinc-700">
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-full shadow-sm mb-4">
                        <SearchX className="h-12 w-12 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Групп пока нет</h2>
                    <p className="text-gray-500 max-w-xs mx-auto mt-2">
                        Создайте свою первую группу, чтобы начать работу с учениками или коллегами
                    </p>
                </div>
            )}
        </div>
    );
}
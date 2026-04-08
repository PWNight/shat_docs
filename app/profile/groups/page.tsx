"use client"
import React, {useActionState, useCallback, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {getSession} from "@/utils/session";
import {CreateGroup, GetAllGroups} from "@/utils/handlers";
import ErrorMessage from "@/components/NotifyAlert";
import {Calendar, Loader2, Plus, SearchX, Users, UserStar} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/Dialog";
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
                    <DialogDescription>Укажите название создаваемой группы</DialogDescription>
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
    const [pageError, setPageError] = useState<string | null>(null);

    // Функция загрузки списка групп
    const loadData = useCallback(async () => {
        const response = await GetAllGroups();
        if (!response.success || !("data" in response)) {
            setPageError(response.message || "Ошибка загрузки групп");
        } else {
            setPageError(null);
            setGroups((response.data as Group[]) || []);
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

    if (pageError) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <p className="text-lg font-semibold">{pageError}</p>
                <button
                    onClick={() => loadData()}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                    Повторить
                </button>
            </div>
        );
    }

    return (
        <div className={'w-[90%] mx-auto space-y-8 animate-in fade-in duration-500 bg-background min-h-screen'}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                    {groups.map((group: Group) => {
                        const isOwner = group.fk_user === userData?.uid;
                        return (
                            <div key={group.id}
                                 className={`group relative flex flex-col p-6 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                                     isOwner
                                         ? 'bg-blue-500/5 border-blue-500/30'
                                         : 'bg-card border-gray-100 dark:border-zinc-700 hover:border-blue-500/50'
                                 }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-3 rounded-xl transition-colors ${
                                        isOwner
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    }`}>
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div className='flex flex-col items-end gap-2'>
                                        {isOwner && (
                                            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-blue-600 text-white rounded-full shadow-sm">
                                                Ваша группа
                                            </span>
                                        )}
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 rounded-full border border-gray-200 dark:border-zinc-700">
                                            ID: {group.id}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
                                    {group.name}
                                </h3>

                                <div className="space-y-1 mb-4">
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-2">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        <span>
                                            {new Date(group.created_by).toLocaleDateString("ru-RU", {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>

                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-2">
                                        <UserStar className="w-4 h-4 text-blue-500" />
                                        <span className="truncate">{group.leader}</span>
                                    </div>
                                </div>

                                <Link
                                    href={`/profile/groups/${group.id}`}
                                    className="mt-auto inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-muted border border-input text-foreground text-sm font-semibold hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all shadow-sm"
                                >
                                    Подробнее
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
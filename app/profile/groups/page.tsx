"use client"
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/utils/session";
import { getAllGroups } from "@/utils/functions";
import ErrorMessage from "@/components/notify-alert";
import { Loader2, SearchX, Plus, Users, Calendar, ArrowRight } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/Dialog";
import { CreateGroup } from "@/utils/handlers";
import Link from "next/link";

interface Group {
    id: string;
    name: string;
    fk_user: string;
    created_by: string;
}

export default function ProfileGroups() {
    const [userData, setUserData] = useState(Object);
    const [pageLoaded, setPageLoaded] = useState(false);
    const [groups, setGroups] = useState([]);
    const [notifyMessage, setNotifyMessage] = useState('');
    const [notifyType, setNotifyType] = useState('');
    const router = useRouter();
    const [state, action, pending] = useActionState(CreateGroup, undefined);

    useEffect(() => {
        getSession().then(async session => {
            if (!session) {
                router.push("/login?to=profile/groups");
                return;
            }
            setUserData({ email: session.email, uid: session.uid });

            const response = await getAllGroups();
            if (!response.success) {
                setNotifyMessage(response.message);
                setNotifyType('error');
                setPageLoaded(true);
                return;
            }
            setGroups(response.data);
            setPageLoaded(true);
        });
    }, [router]);

    const handleClose = () => setNotifyMessage('');

    // Состояние загрузки
    if (!pageLoaded) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        );
    }

    const GroupCreateForm = () => {
        const [open, setOpen] = useState(false);

        useEffect(() => {
            if (state?.success) setOpen(false);
        }, []);

        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm active:scale-95">
                        <Plus className="w-5 h-5" />
                        Создать группу
                    </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Новая группа</DialogTitle>
                    </DialogHeader>
                    <form action={action} className="space-y-4 mt-4">
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
                            <input type="hidden" name="fk_user" defaultValue={userData.uid} />

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

    return (
        <div className="w-full px-2 mt-4">
            {notifyMessage && <ErrorMessage message={notifyMessage} onClose={handleClose} type={notifyType} />}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Группы
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-lg">
                        Управление учебными коллективами и участниками
                    </p>
                </div>
                <GroupCreateForm />
            </div>

            {groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {groups.map((group: Group) => (
                        <div
                            key={group.id}
                            className="group relative flex flex-col p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                    <Users className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-gray-100 dark:bg-zinc-700 rounded text-gray-500">
                                    ID: {group.id}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                                {group.name}
                            </h3>

                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6 gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(group.created_by).toLocaleDateString("ru-RU", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>

                            <Link
                                href={`/profile/groups/${group.id}`}
                                className="mt-auto flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-zinc-700/50 hover:bg-blue-600 hover:text-white text-gray-700 dark:text-gray-200 font-semibold py-3 rounded-xl transition-all"
                            >
                                Управлять
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-gray-50 dark:bg-zinc-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-zinc-700">
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-full shadow-sm mb-4">
                        <SearchX className="h-12 w-12 text-gray-400" />
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
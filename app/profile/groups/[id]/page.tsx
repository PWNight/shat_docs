"use client"
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useTransition, use, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Импорт для анимаций
import {
    Loader2, Trash2,
    ShieldAlert, Save,
    ClipboardCheck, GraduationCap, Calendar, UserStar, ArrowLeft
} from "lucide-react";
import {
    Dialog, DialogTrigger, DialogContent,
    DialogHeader, DialogTitle, DialogFooter,
    DialogDescription, DialogClose
} from "@/components/ui/Dialog";
import GroupAttendance from "@/components/GroupAttendance";
import GroupGrades from "@/components/GroupGrades";
import GroupStudents from "@/components/GroupStudents";
import ErrorMessage from "@/components/NotifyAlert";
import PageErrorState from "@/components/ui/PageErrorState";
import { isDbOfflineText } from "@/utils/ui-errors";
import { getSession, SessionPayload } from "@/utils/session";
import { GetGroup, GetUsersList, UpdateGroup, DeleteGroup, GetStudents } from "@/utils/handlers";
import { Group, Notify, Student } from "@/utils/interfaces";

interface UserListItem { id: number; full_name: string; }

export default function MyGroup({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const groupId = resolvedParams.id;
    const router = useRouter();

    const [userData, setUserData] = useState<SessionPayload | null>(null);
    const [group, setGroup] = useState<Group | null>(null);
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [activeTab, setActiveTab] = useState<'attendance' | 'grades' | 'students'>('attendance');
    const [notify, setNotify] = useState<Notify>({ message: '', type: '' });
    const [updateFormData, setUpdateFormData] = useState({ name: '', fk_user: '' });
    const [students, setStudents] = useState<Student[]>([]);
    const [isPending, startTransition] = useTransition();
    const [pageError, setPageError] = useState<string | null>(null);

    const loadData = useCallback(async (id: string) => {
        const groupRes = await GetGroup(id);
        if (!groupRes.success || !("data" in groupRes) || !groupRes.data) {
            setPageError(groupRes.message || "Группа не найдена или недоступна");
            return;
        }

        const groupData = groupRes.data as Group;
        setGroup(groupData);
        setUpdateFormData({ name: groupData.name, fk_user: String(groupData.fk_user) });

        const [usersRes, studentsRes] = await Promise.allSettled([GetUsersList(), GetStudents(id)]);
        if (usersRes.status === "fulfilled" && usersRes.value.success && "data" in usersRes.value) {
            setUsers((usersRes.value.data as UserListItem[]) ?? []);
        } else {
            setNotify({ message: "Не удалось загрузить список преподавателей", type: "warning" });
        }
        if (studentsRes.status === "fulfilled" && studentsRes.value.success && "data" in studentsRes.value) {
            setStudents((studentsRes.value.data as Student[]) ?? []);
        } else {
            setNotify({ message: "Не удалось загрузить список студентов", type: "warning" });
        }
    }, [router]);

    useEffect(() => {
        getSession().then(session => {
            if (!session) return router.replace(`/login?to=profile/groups/${groupId}`);
            setUserData(session);
            loadData(groupId);
        });
    }, [groupId, loadData, router]);

    const isOwner = userData?.uid === group?.fk_user;

    if (pageError) {
        const dbOffline = isDbOfflineText(pageError);
        return (
            <PageErrorState
                kind={dbOffline ? "db" : "generic"}
                title={dbOffline ? "Нет подключения к базе данных" : "Не удалось загрузить группу"}
                description={dbOffline ? "Проверьте доступность БД и повторите попытку." : undefined}
                details={dbOffline ? pageError : undefined}
                onAction={() => window.location.reload()}
            />
        );
    }

        
    if (!group) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-6">
                <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                        <div>
                            <p className="font-semibold">Загружаю управление группой</p>
                            <p className="text-sm text-muted-foreground">Подготавливаю данные о группе, посещаемости, успеваемости и студентах</p>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div
                                className="h-full w-1/3 bg-blue-600 rounded-full"
                                animate={{ x: ["-20%", "220%"] }}
                                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>
                        <div className="text-xs text-muted-foreground">Это займет несколько секунд</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 bg-background min-h-screen">
            {notify.message && <ErrorMessage message={notify.message} type={notify.type} onClose={() => setNotify({ message: '', type: '' })} />}

            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/profile/groups')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Назад к списку групп
                </button>
            </div>

            <div className="bg-card rounded-lg border border-gray-100 dark:border-zinc-700 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center lg:p-6 p-4">
                    <div className="flex items-center gap-5 w-full md:w-auto mb-2">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">Название группы</label>
                            <div className="relative group sm:max-w-sm">
                                <input
                                    disabled={!isOwner}
                                    value={updateFormData.name}
                                    onChange={e => setUpdateFormData({ ...updateFormData, name: e.target.value })}
                                    className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 outline-none w-full pb-1 transition-all disabled:opacity-80"
                                />
                                <div className="flex flex-row justify-between items-center xl:items-start gap-2 mt-2">
                                    <div className='flex gap-2 flex-col h-full'>
                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-2">
                                            <Calendar className="w-5 h-5" />
                                            <span>{new Date(group.created_by).toLocaleDateString("ru-RU", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>

                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-2">
                                            <UserStar className="w-5 h-5" />
                                            <span>{group.leader}</span>
                                        </div>
                                    </div>
                                    <div className='flex gap-2 flex-col h-full'>
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-gray-100 dark:bg-zinc-700 rounded dark:text-gray-300 shadow-sm">ID: {group.id}</span>
                                        {isOwner && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-blue-600 text-white rounded shadow-sm">Ваша группа</span>}
                                    </div>
                                </div>
                                {isOwner && (
                                    <button onClick={() => startTransition(async () => {
                                        const result = await UpdateGroup(groupId, updateFormData) as { success: boolean; message?: string };
                                        if (!result.success) {
                                            setNotify({ message: result.message || "Ошибка сохранения", type: "error" });
                                            return;
                                        }
                                        setNotify({ message: "Сохранено", type: 'success' });
                                        await loadData(groupId);
                                    })} className="absolute right-0 top-1 text-blue-600 hover:scale-110 transition-all">
                                        {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={20} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {isOwner && (
                        <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-gray-100">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="flex-1 md:flex-none flex items-center gap-2 px-4 py-2.5 bg-amber-50 shadow-sm dark:bg-zinc-700/50 text-amber-600 rounded-lg font-semibold text-sm hover:bg-amber-500! hover:text-white! transition-colors">
                                        <ShieldAlert size={18} /> Передать
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogHeader className={'text-left'}>
                                            <DialogTitle>Передача прав</DialogTitle>
                                            <DialogDescription className="pt-2">
                                                Выберите нового классного руководителя для группы «{group.name}».<br />
                                                Это действие нельзя отменить.
                                            </DialogDescription>
                                        </DialogHeader>
                                    </DialogHeader>
                                    <select
                                        className="w-full p-3 mt-4 rounded-lg border dark:bg-zinc-900 outline-none"
                                        value={updateFormData.fk_user}
                                        onChange={e => setUpdateFormData({ ...updateFormData, fk_user: e.target.value })}
                                    >
                                        <option value="" disabled>Выберите нового владельца</option>
                                        {users
                                            .filter(u => u.id !== userData?.uid)
                                            .map(u => (
                                                <option key={u.id} value={String(u.id)}>
                                                    {u.full_name}
                                                </option>
                                            ))
                                        }
                                    </select>
                                    <DialogFooter className="gap-3">
                                        <button
                                            onClick={() => {
                                                if (!updateFormData.fk_user) return;
                                                startTransition(async () => {
                                                    const result = await UpdateGroup(groupId, updateFormData) as { success: boolean; message?: string };
                                                    if (!result.success) {
                                                        setNotify({ message: result.message || "Ошибка передачи прав", type: "error" });
                                                        return;
                                                    }
                                                    router.push('/profile/groups');
                                                });
                                            }}
                                            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-lg font-bold"
                                            disabled={!updateFormData.fk_user}
                                        >
                                            Подтвердить
                                        </button>
                                        <DialogClose className="flex-1 bg-gray-200 dark:bg-zinc-700 py-3 rounded-lg font-medium">
                                            Отмена
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="shadow-sm flex-1 md:flex-none flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-zinc-700/50 text-red-600 dark:text-red-500 hover:bg-red-500! hover:text-white! rounded-lg font-semibold text-sm transition-colors">
                                        <Trash2 size={18} /> Удалить
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader className={'text-left'}>
                                        <DialogTitle>Удаление группы</DialogTitle>
                                        <DialogDescription className="pt-2">
                                            Вы действительно хотите удалить группу «{group.name}»?<br />
                                            Это действие нельзя отменить.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="gap-3 sm:gap-4">
                                        <button
                                            onClick={() => startTransition(async () => {
                                                const result = await DeleteGroup(groupId) as { success: boolean; message?: string };
                                                if (!result.success) {
                                                    setNotify({ message: result.message || "Ошибка удаления", type: "error" });
                                                    return;
                                                }
                                                router.push('/profile/groups');
                                            })}
                                            className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold"
                                        >
                                            Да, удалить
                                        </button>
                                        <DialogClose className="flex-1 bg-gray-200 dark:bg-zinc-700 py-3 rounded-lg font-medium">
                                            Отмена
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-4 lg:justify-start justify-between border-b dark:border-zinc-700 relative">
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`relative pb-3 sm:px-4 flex items-center gap-2 font-bold text-sm transition-all ${activeTab === 'attendance' ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-500'}`}
                >
                    <ClipboardCheck size={18} /> Посещаемость
                    {activeTab === 'attendance' && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('grades')}
                    className={`relative pb-3 sm:px-4 flex items-center gap-2 font-bold text-sm transition-all ${activeTab === 'grades' ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-500'}`}
                >
                    <GraduationCap size={18} /> Успеваемость
                    {activeTab === 'grades' && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('students')}
                    className={`relative pb-3 sm:px-4 flex items-center gap-2 font-bold text-sm transition-all ${activeTab === 'students' ? 'text-green-600 dark:text-green-400' : 'text-neutral-500'}`}
                >
                    <UserStar size={18} /> Студенты
                    {activeTab === 'students' && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
                    )}
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className={activeTab === "attendance" ? "block" : "hidden"}>
                        <GroupAttendance groupId={groupId} group={group} isOwner={isOwner} setNotify={setNotify} />
                    </div>
                    <div className={activeTab === "grades" ? "block" : "hidden"}>
                        <GroupGrades groupId={groupId} group={group} isOwner={isOwner} setNotify={setNotify} />
                    </div>
                    <div className={activeTab === "students" ? "block" : "hidden"}>
                        <GroupStudents groupId={groupId} groupName={group.name} students={students} setStudents={setStudents} isOwner={isOwner} setNotify={setNotify} />
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

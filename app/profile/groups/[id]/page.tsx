"use client"
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useTransition, use } from "react";
import {
    Loader2, Pencil, Trash2, UserPlus, ArrowLeft,
    Settings, Users, GraduationCap, ShieldAlert, Save, CircleX
} from "lucide-react";
import {
    Dialog, DialogTrigger, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/Dialog";
import ErrorMessage from "@/components/notify-alert";
import { getSession } from "@/utils/session";
import { getGroup, getStudentsByGroup, getUsersList } from "@/utils/functions";
import { UpdateGroup, DeleteGroup, SaveStudent, DeleteStudent } from "@/utils/handlers";
import Link from "next/link";

// Интерфейсы
interface Student {
    id: number;
    full_name: string;
    admission_year: number;
}

interface Group {
    id: string;
    name: string;
    fk_user: string;
}

interface UserListItem {
    id: string;
    email: string;
}

interface Notify {
    message: string;
    type: 'success' | 'error' | '';
}

interface StudentDialogProps {
    student?: Student;
    groupId: string;
    onRefresh: () => Promise<void>;
    setNotify: (n: Notify) => void;
}

function StudentDialog({ student, groupId, onRefresh, setNotify }: StudentDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        full_name: student?.full_name || '',
        admission_year: student?.admission_year || new Date().getFullYear()
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await SaveStudent(student?.id?.toString(), { ...form, fk_group: groupId });
            if (!result.success) {
                setNotify({ message: result.message || "Ошибка", type: 'error' });
                return;
            }
            setNotify({ message: "Список студентов успешно обновлён", type: 'success' });
            setOpen(false);
            await onRefresh();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {student ? (
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                        <Pencil size={18} />
                    </button>
                ) : (
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-sm active:scale-95 text-sm">
                        <UserPlus className="w-4 h-4" /> Добавить
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">
                            {student ? 'Редактировать студента' : 'Новый студент'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Полное имя</label>
                            <input
                                placeholder="Иванов Иван Иванович"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={form.full_name}
                                onChange={e => setForm({ ...form, full_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Год поступления</label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={form.admission_year}
                                onChange={e => setForm({ ...form, admission_year: parseInt(e.target.value) || 0 })}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : student ? "Обновить данные" : "Добавить в список"}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function MyGuild({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const groupId = resolvedParams.id;
    const router = useRouter();

    const [userData, setUserData] = useState({uid: ""});
    const [group, setGroup] = useState<Group | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [updateFormData, setUpdateFormData] = useState({ name: '', fk_user: '' });

    const [isPending, startTransition] = useTransition();
    const [pageLoaded, setPageLoaded] = useState(false);
    const [notify, setNotify] = useState<Notify>({ message: '', type: '' });

    const loadData = async (id: string) => {
        const [groupRes, studentsRes, usersRes] = await Promise.all([
            getGroup(id),
            getStudentsByGroup(id),
            getUsersList()
        ]);

        if (groupRes.success) {
            setGroup(groupRes.data);
            setUpdateFormData({ name: groupRes.data.name, fk_user: `${groupRes.data.fk_user}` });
        }
        if (studentsRes.success) setStudents(studentsRes.data);
        if (usersRes.success) setUsers(usersRes.data);
    };

    useEffect(() => {
        getSession().then(async session => {
            if (!session) {
                router.push(`/login?to=profile/groups/${groupId}`);
                return;
            }
            setUserData(session);
            await loadData(groupId);
            setPageLoaded(true);
        });
    }, [groupId, router]);

    const handleUpdateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setNotify({ message: '', type: '' });

        startTransition(async () => {
            const result = await UpdateGroup(groupId, updateFormData);
            if (!result.success) {
                setNotify({ message: result.message || "Ошибка", type: 'error' });
                return;
            }
            setNotify({ message: 'Настройки группы успешно сохранены', type: 'success' });
            await loadData(groupId);
        });
    };

    const handleDeleteGroup = async () => {
        const result = await DeleteGroup(groupId);
        if (!result.success) {
            setNotify({ message: result.message || "Ошибка", type: 'error' });
            return;
        }
        router.push('/profile/groups');
    };

    const handleDeleteStudent = async (studentId: number) => {
        const result = await DeleteStudent(studentId);
        if (!result.success) {
            setNotify({ message: result.message || "Ошибка", type: 'error' });
            return;
        }
        setNotify({ message: "Студент успешно удалён", type: 'success' });
        await loadData(groupId);
    };

    if (!pageLoaded || !group) return (
        <div className="flex h-[60vh] w-full items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
    );

    const isOwner = userData?.uid === group?.fk_user;

    return (
        <div className="w-full px-2 mt-4 space-y-6">
            {notify.message && (
                <ErrorMessage
                    message={notify.message}
                    type={notify.type}
                    onClose={() => setNotify({ message: '', type: '' })}
                />
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/profile/groups" className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {group.name}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                            <Users className="w-4 h-4" /> {students.length} студентов в группе
                        </p>
                    </div>
                </div>

                {isOwner && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <button className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-5 py-2.5 rounded-xl font-semibold transition-all border border-red-100">
                                <Trash2 className="w-5 h-5" /> Удалить группу
                            </button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-red-600">Удаление группы</DialogTitle>
                                <DialogDescription className="text-lg">
                                    Вы уверены, что хотите удалить группу <strong>{group.name}</strong>? Это действие удалит всех студентов и историю обучения без возможности восстановления.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="mt-4 gap-2">
                                <button onClick={handleDeleteGroup} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-all">
                                    Да, удалить навсегда
                                </button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                <Settings className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold">Параметры</h2>
                        </div>

                        <form onSubmit={handleUpdateGroup} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Название</label>
                                <input
                                    disabled={!isOwner}
                                    value={updateFormData.name}
                                    onChange={(e) => setUpdateFormData({ ...updateFormData, name: e.target.value })}
                                    className="disabled:opacity-60 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Преподаватель (Владелец)</label>
                                <select
                                    disabled={!isOwner}
                                    value={updateFormData.fk_user}
                                    onChange={(e) => setUpdateFormData({ ...updateFormData, fk_user: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-60 appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Выберите преподавателя</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.email} {u.id === userData?.uid ? "(Вы)" : ""}
                                        </option>
                                    ))}
                                </select>
                                {isOwner && (
                                    <p className="text-[11px] text-gray-500 px-1">Передача группы сменит ответственного пользователя.</p>
                                )}
                            </div>
                            {isOwner && (
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Сохранить
                                </button>
                            )}
                        </form>
                    </div>
                    {isOwner && (
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                            <div>
                                <h4 className="flex gap-2 items-center font-bold text-orange-800 dark:text-orange-400"><ShieldAlert className="w-5 h-5 text-orange-600" /> Внимание</h4>
                                <p className="text-sm text-orange-700 dark:text-orange-500/80 mt-1">
                                    Изменение ID владельца немедленно ограничит ваш доступ к управлению этой группой.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-zinc-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold">Студенты</h2>
                            </div>
                            {isOwner && (
                                <StudentDialog
                                    groupId={groupId}
                                    onRefresh={() => loadData(groupId)}
                                    setNotify={setNotify}
                                />
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                <tr className="bg-gray-50/50 dark:bg-zinc-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-bold">ФИО Студента</th>
                                    <th className="px-6 py-4 font-bold">Год поступления</th>
                                    <th className="px-6 py-4 font-bold text-right">Действия</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-zinc-700">
                                {students.length > 0 ? students.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                {student.full_name}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-mono uppercase">ID: {student.id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            {student.admission_year}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {isOwner ? (
                                                <div className="flex justify-end gap-2">
                                                    <StudentDialog
                                                        student={student}
                                                        groupId={groupId}
                                                        onRefresh={() => loadData(groupId)}
                                                        setNotify={setNotify}
                                                    />
                                                    <button
                                                        onClick={async () => { if (confirm('Удалить студента?')) { await handleDeleteStudent(student.id) } }}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <CircleX size={18} className="w-5 h-5 text-gray-400 mr-6" />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500 italic">
                                            В группе пока нет ни одного студента
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
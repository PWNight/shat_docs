"use client"
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useTransition, use, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Импорт для анимаций
import {
    Loader2, Trash2,
    ShieldAlert, Save,
    Upload, FileText, Database, Download,
    GraduationCap, ClipboardCheck, Calendar, UserStar
} from "lucide-react";
import {
    Dialog, DialogTrigger, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription, DialogClose
} from "@/components/ui/Dialog";
import PeriodSelectionDialog from "@/components/PeriodSelectionDialog";
import ErrorMessage from "@/components/NotifyAlert";
import { getSession, SessionPayload } from "@/utils/session";
import {GetGroup, GetUsersList, SaveGrades, GetGrades} from "@/utils/handlers";
import {UpdateGroup, DeleteGroup, SaveAttendance, GetAttendance} from "@/utils/handlers";
import {exportGradesToWord, exportToWord} from "@/utils/functions";
import {
    AttendanceStudent, AttendanceTotal, Group, Notify, GradeStudent, MONTH_NAMES, SEMESTER_NAMES
} from "@/utils/interfaces";

interface UserListItem { id: number; full_name: string; }

export default function MyGroup({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const groupId = resolvedParams.id;
    const router = useRouter();

    const [userData, setUserData] = useState<SessionPayload | null>(null);
    const [group, setGroup] = useState<Group | null>(null);
    const [users, setUsers] = useState<UserListItem[]>([]);

    const [attendanceStudents, setAttendanceStudents] = useState<AttendanceStudent[]>([]);
    const [attendanceTotal, setAttendanceTotal] = useState<AttendanceTotal>(Object);
    const [showAttendancePeriodDialog, setShowAttendancePeriodDialog] = useState(false);
    const [pendingAttendanceData, setPendingAttendanceData] = useState<AttendanceStudent[] | null>(null);
    const [selectedAttendancePeriod, setSelectedAttendancePeriod] = useState<number | null>(null);
    const [attendanceByPeriod, setAttendanceByPeriod] = useState<Record<number, AttendanceStudent[]>>({});
    const [isAttendanceModified, setIsAttendanceModified] = useState(false);
    const [isAttendanceSaving, setIsAttendanceSaving] = useState(false);
    const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);

    const [activeTab, setActiveTab] = useState<'attendance' | 'grades'>('attendance');
    const [gradesStudents, setGradesStudents] = useState<GradeStudent[]>([]);
    const [showGradesPeriodDialog, setShowGradesPeriodDialog] = useState(false);
    const [pendingGradesData, setPendingGradesData] = useState<GradeStudent[] | null>(null);
    const [selectedGradesPeriod, setSelectedGradesPeriod] = useState<number | null>(null);
    const [gradesbyPeriod, setGradesbyPeriod] = useState<Record<number, GradeStudent[]>>({});
    const [isGradesModified, setIsGradesModified] = useState(false);
    const [isGradesSaving, setIsGradesSaving] = useState(false);
    const [isGradesLoading, setIsGradesLoading] = useState(false);
    const [isDraggingGrades, setIsDraggingGrades] = useState(false);

    const [notify, setNotify] = useState<Notify>({ message: '', type: '' });
    const [updateFormData, setUpdateFormData] = useState({ name: '', fk_user: '' });

    const [isPending, startTransition] = useTransition();
    const [isDragging, setIsDragging] = useState(false);

    const loadData = useCallback(async (id: string) => {
        const groupRes = await GetGroup(id);
        if (!groupRes.success) return router.replace(`/profile/groups`);

        setGroup(groupRes.data);
        setUpdateFormData({ name: groupRes.data.name, fk_user: String(groupRes.data.fk_user) });

        const usersRes = await GetUsersList();
        setUsers(usersRes.data ?? []);
    }, [router]);

    useEffect(() => {
        getSession().then(session => {
            if (!session) return router.replace(`/login?to=profile/groups/${groupId}`);
            setUserData(session);
            loadData(groupId).then(() => {
                const total = attendanceStudents.reduce((acc, curr) => ({
                    fullDaysTotal: acc.fullDaysTotal + curr.fullDaysTotal,
                    fullDaysSick: acc.fullDaysSick + curr.fullDaysSick,
                    lessonsTotal: acc.lessonsTotal + curr.lessonsTotal,
                    lessonsSick: acc.lessonsSick + curr.lessonsSick,
                    late: acc.late + curr.late,
                }), { fullDaysTotal: 0, fullDaysSick: 0, lessonsTotal: 0, lessonsSick: 0, late: 0 });
                setAttendanceTotal(total);
            });
        });
    }, [groupId, loadData, router, attendanceStudents]);

    const isOwner = userData?.uid === group?.fk_user;

    const handleAttendanceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isOwner) return;
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(event.target?.result as string, 'text/html');
            const table = doc.querySelector('table.marks');
            if (!table) return setNotify({ message: "Таблица не найдена", type: 'error' });
            const data: AttendanceStudent[] = Array.from(table.querySelectorAll('tr')).map(row => {
                const cells = Array.from(row.cells);
                if (cells.length < 7 || !/^\d+$/.test(cells[0].textContent?.trim() || '')) return null;
                return {
                    number: cells[0].textContent?.trim() || '',
                    fullName: cells[1].textContent?.trim() || '',
                    fullDaysTotal: Number(cells[2].textContent) || 0,
                    fullDaysSick: Number(cells[3].textContent) || 0,
                    lessonsTotal: Number(cells[4].textContent) || 0,
                    lessonsSick: Number(cells[5].textContent) || 0,
                    late: Number(cells[6].textContent) || 0,
                };
            }).filter(Boolean) as AttendanceStudent[];
            setPendingAttendanceData(data);
            setShowAttendancePeriodDialog(true);
        };
        reader.readAsText(file);
    };

    const handleAttendancePeriodConfirm = async (period: number) => {
        if (selectedAttendancePeriod !== null && isAttendanceModified && attendanceStudents.length > 0) {
            setIsAttendanceSaving(true);
            const studentsToSave = attendanceStudents.map(s => ({
                ...s,
                periodMonth: selectedAttendancePeriod
            })) as AttendanceStudent[];
            await SaveAttendance(groupId, studentsToSave);
            setAttendanceByPeriod(prev => ({
                ...prev,
                [selectedAttendancePeriod]: studentsToSave
            }));
            setIsAttendanceSaving(false);
            setIsAttendanceModified(false);
        }

        if (!pendingAttendanceData) {
            setIsAttendanceLoading(true);
            const result = await GetAttendance(groupId, period);
            setIsAttendanceLoading(false);
            if (result.success && result.data.length > 0) {
                setAttendanceStudents(result.data);
                setAttendanceByPeriod(prev => ({
                    ...prev,
                    [period]: result.data
                }));
                setNotify({ message: `Загружены данные за ${MONTH_NAMES[period as keyof typeof MONTH_NAMES]}`, type: 'success' });
            } else {
                setAttendanceStudents([]);
                setNotify({ message: `Нет данных для ${MONTH_NAMES[period as keyof typeof MONTH_NAMES]}`, type: 'warning' });
            }
        } else {
            const dataWithPeriod = pendingAttendanceData.map(student => ({
                ...student,
                periodMonth: period
            }));
            setAttendanceStudents(dataWithPeriod);
            setAttendanceByPeriod(prev => ({
                ...prev,
                [period]: dataWithPeriod
            }));
            setPendingAttendanceData(null);
            setNotify({ message: "Месяц выбран", type: 'success' });
            setIsAttendanceModified(false);
        }

        setSelectedAttendancePeriod(period);
    };

    const handleLoadFromDB = async () => {
        setShowAttendancePeriodDialog(true);
    };

    const updateAttendanceField = (index: number, field: keyof AttendanceStudent, value: string) => {
        if (!isOwner) return;
        const updated = [...attendanceStudents];
        updated[index] = { ...updated[index], [field]: (field === 'fullName' || field === 'number') ? value : (parseInt(value) || 0) };
        setAttendanceStudents(updated);
        setIsAttendanceModified(true);
    };

    const handleGradesFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isOwner) return;
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(event.target?.result as string, 'text/html');

            const table = doc.querySelector('table.grid.gridLines.vam.marks.print_A4') ||
                doc.querySelector('table');
            if (!table) return setNotify({ message: "Таблица успеваемости не найдена", type: 'error' });

            const rows = Array.from(table.querySelectorAll('tr'));

            const headerRowIndex = rows.findIndex(r =>
                r.textContent?.includes('Фамилия') && r.textContent?.includes('Имя')
            );
            if (headerRowIndex === -1) {
                return setNotify({ message: "Неверный формат файла (не найдена шапка)", type: 'error' });
            }

            const headerCells = Array.from(rows[headerRowIndex].cells);
            const subjectsList = headerCells.slice(2, -2).map(cell => {
                let name = cell.textContent || '';
                name = name.replace(/[\n\r]+/g, ' ');
                return name.replace(/\s+/g, ' ').trim();
            });

            const data: GradeStudent[] = rows
                .slice(headerRowIndex + 1)
                .map(row => {
                    const cells = Array.from(row.cells);
                    const numText = cells[0]?.textContent?.trim() || '';

                    if (!/^\d+$/.test(numText) || cells.length < 2 + subjectsList.length) {
                        return null;
                    }

                    const fullName = (cells[1]?.textContent || '')
                        .replace(/[\n\r]+/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();

                    const subjects = subjectsList.map((name, idx) => ({
                        name,
                        grade: (cells[idx + 2]?.textContent || '').trim().replace(/\u00A0/g, '')
                    }));

                    const validGrades = subjects
                        .map(s => parseFloat(s.grade.replace(',', '.')))
                        .filter(g => !isNaN(g) && g >= 2 && g <= 5);

                    const averageScore = validGrades.length > 0
                        ? parseFloat((validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(2))
                        : 0;

                    return { fullName, subjects, averageScore };
                })
                .filter(Boolean) as GradeStudent[];

            if (data.length === 0) {
                return setNotify({ message: "Не удалось извлечь учеников", type: 'error' });
            }

            setPendingGradesData(data);
            setShowGradesPeriodDialog(true);
        };

        reader.readAsText(file);
    };

    const handleGradesPeriodConfirm = async (period: number) => {
        if (selectedGradesPeriod !== null && isGradesModified && gradesStudents.length > 0) {
            setIsGradesSaving(true);
            const studentsToSave = gradesStudents.map(s => ({
                ...s,
                periodSemester: selectedGradesPeriod
            })) as GradeStudent[];
            await SaveGrades(groupId, studentsToSave);
            setGradesbyPeriod(prev => ({
                ...prev,
                [selectedGradesPeriod]: studentsToSave
            }));
            setIsGradesSaving(false);
            setIsGradesModified(false);
        }

        if (!pendingGradesData) {
            setIsGradesLoading(true);
            const result = await GetGrades(groupId, period);
            setIsGradesLoading(false);
            if (result.success && result.data.length > 0) {
                setGradesStudents(result.data);
                setGradesbyPeriod(prev => ({
                    ...prev,
                    [period]: result.data
                }));
                setNotify({ message: `Загружены данные за ${SEMESTER_NAMES[period as keyof typeof SEMESTER_NAMES]}`, type: 'success' });
            } else {
                setGradesStudents([]);
                setNotify({ message: `Нет данных для ${SEMESTER_NAMES[period as keyof typeof SEMESTER_NAMES]}`, type: 'warning' });
            }
        } else {
            const dataWithPeriod = pendingGradesData.map(student => ({
                ...student,
                periodSemester: period
            }));
            setGradesStudents(dataWithPeriod);
            setGradesbyPeriod(prev => ({
                ...prev,
                [period]: dataWithPeriod
            }));
            setPendingGradesData(null);
            setNotify({ message: "Полугодие выбрано", type: 'success' });
            setIsGradesModified(false);
        }

        setSelectedGradesPeriod(period);
    };

    const handleLoadGradesFromDB = async () => {
        setShowGradesPeriodDialog(true);
    };

    const updateGradeField = (studentIndex: number, subjectIndex: number, value: string) => {
        if (!isOwner) return;

        if (value !== "" && !/^[1-5]$/.test(value)) {
            return;
        }

        const updated = [...gradesStudents];
        updated[studentIndex].subjects[subjectIndex].grade = value;

        const validGrades = updated[studentIndex].subjects
            .map(s => {
                const val = s.grade.trim();
                const num = parseFloat(val.replace(',', '.'));
                return isNaN(num) || val === '' ? 0 : num;
            })
            .filter(g => g > 0);

        updated[studentIndex].averageScore = validGrades.length > 0
            ? parseFloat((validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(2))
            : 0;

        setGradesStudents(updated);
        setIsGradesModified(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isOwner) {
            if (activeTab === 'attendance') setIsDragging(true);
            else setIsDraggingGrades(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setIsDraggingGrades(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setIsDraggingGrades(false);

        if (!isOwner) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const mockEvent = { target: { files: files } } as unknown as React.ChangeEvent<HTMLInputElement>;
            if (activeTab === 'attendance') handleAttendanceFileUpload(mockEvent);
            else handleGradesFileUpload(mockEvent);
        }
    };

    const getScholarshipInfo = (subjects: { grade: string }[]) => {
        const grades = subjects.map(s => {
            const val = s.grade.trim();
            return val === '' ? 2 : parseInt(val);
        }).filter(g => !isNaN(g));

        if (grades.some(g => g <= 3)) return { label: "Нет", color: "bg-transparent", multiplier: 0 };

        const count5 = grades.filter(g => g === 5).length;
        const count4 = grades.filter(g => g === 4).length;

        if (count4 === 0 && count5 > 0) return { label: "200%", color: "bg-blue-100 dark:bg-blue-900/30", multiplier: 2 };
        if (count5 > count4) return { label: "150%", color: "bg-green-100 dark:bg-green-900/30", multiplier: 1.5 };
        if (count4 > 0) return { label: "100%", color: "bg-yellow-100 dark:bg-yellow-900/30", multiplier: 1 };

        return { label: "—", color: "bg-transparent", multiplier: 0 };
    };

    const getGradeColor = (grade: string) => {
        const val = grade.trim();
        if (val === '') return "bg-red-500/20 dark:bg-red-900/40";

        const g = parseInt(val);
        if (g === 5) return "bg-green-600/30 text-green-700 dark:text-green-300";
        if (g === 4) return "bg-emerald-400/20 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300";
        if (g === 3) return "bg-amber-400/20 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400";

        if (g <= 2 && g > 0) return "bg-red-500/20 dark:bg-red-600/30 text-red-700 dark:text-red-400";

        return "";
    };

    if (!group) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="w-full space-y-5 sm:space-y-6 pb-8 sm:pb-10 animate-in fade-in duration-500">
            {notify.message && <ErrorMessage message={notify.message} type={notify.type} onClose={() => setNotify({ message: '', type: '' })} />}

            <div className="bg-card rounded-lg border border-gray-100 dark:border-zinc-700 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center lg:p-6 p-4">
                    <div className="flex items-center gap-5 w-full md:w-auto mb-2">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">Название группы</label>
                            <div className="relative group sm:max-w-sm">
                                <input
                                    disabled={!isOwner}
                                    value={updateFormData.name}
                                    onChange={e => setUpdateFormData({...updateFormData, name: e.target.value})}
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
                                    <button onClick={() => startTransition(async () => { await UpdateGroup(groupId, updateFormData); setNotify({message: "Сохранено", type: 'success'}); await loadData(groupId); })} className="absolute right-0 top-1 text-blue-600 hover:scale-110 transition-all">
                                        {isPending ? <Loader2 className="animate-spin" size={18}/> : <Save size={20}/>}
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
                                        <ShieldAlert size={18}/> Передать
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogHeader className={'text-left'}>
                                            <DialogTitle>Передача прав</DialogTitle>
                                            <DialogDescription className="pt-2">
                                                Выберите нового классного руководителя для группы «{group.name}».<br/>
                                                Это действие нельзя отменить.
                                            </DialogDescription>
                                        </DialogHeader>
                                    </DialogHeader>
                                    <select
                                        className="w-full p-3 mt-4 rounded-lg border dark:bg-zinc-900 outline-none"
                                        value={updateFormData.fk_user}
                                        onChange={e => setUpdateFormData({...updateFormData, fk_user: e.target.value})}
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
                                                    await UpdateGroup(groupId, updateFormData);
                                                    router.push('/profile/groups');
                                                });
                                            }}
                                            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-lg font-bold"
                                            disabled={!updateFormData.fk_user}
                                        >
                                            Подтвердить
                                        </button>
                                        <DialogClose asChild>
                                            <button className="flex-1 bg-gray-200 dark:bg-zinc-700 py-3 rounded-lg font-medium">
                                                Отмена
                                            </button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="shadow-sm flex-1 md:flex-none flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-zinc-700/50 text-red-600 dark:text-red-500  hover:bg-red-500! hover:text-white! rounded-lg font-semibold text-sm transition-colors">
                                        <Trash2 size={18}/> Удалить
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader className={'text-left'}>
                                        <DialogTitle>Удаление группы</DialogTitle>
                                        <DialogDescription className="pt-2">
                                            Вы действительно хотите удалить группу «{group.name}»?<br/>
                                            Это действие нельзя отменить.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="gap-3 sm:gap-4">
                                        <button
                                            onClick={() => startTransition(async () => {
                                                await DeleteGroup(groupId);
                                                router.push('/profile/groups');
                                            })}
                                            className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold"
                                        >
                                            Да, удалить
                                        </button>
                                        <DialogClose asChild>
                                            <button className="flex-1 bg-gray-200 dark:bg-zinc-700 py-3 rounded-lg font-medium">
                                                Отмена
                                            </button>
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
                    className={`relative pb-3 px-4 flex items-center gap-2 font-bold text-sm transition-all ${activeTab === 'attendance' ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-500'}`}
                >
                    <ClipboardCheck size={18} /> Посещаемость
                    {activeTab === 'attendance' && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('grades')}
                    className={`relative pb-3 px-4 flex items-center gap-2 font-bold text-sm transition-all ${activeTab === 'grades' ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-500'}`}
                >
                    <GraduationCap size={18} /> Успеваемость
                    {activeTab === 'grades' && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
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
                    {activeTab === 'attendance' && (
                        <div className="w-full bg-card rounded-lg border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-zinc-800 dark:to-zinc-800/50 border-b border-gray-100 dark:border-zinc-700 px-6 py-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-600 text-white rounded-lg"><FileText size={20}/></div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ведомость посещаемости</h2>
                                            {selectedAttendancePeriod !== null && (
                                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center mt-0.5">
                                                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                                    <span className="font-medium">{MONTH_NAMES[selectedAttendancePeriod as keyof typeof MONTH_NAMES]}</span>
                                                    {isAttendanceSaving && <Loader2 className="w-3 h-3 ml-2 animate-spin text-blue-600" />}
                                                    {isAttendanceModified && <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">Не сохранено</span>}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {attendanceStudents.length > 0 && (
                                        <div className="text-right">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                <span className="font-semibold text-gray-900 dark:text-white">{attendanceStudents.length}</span> учеников
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/20">
                                <div className="flex sm:flex-row flex-col sm:items-center gap-2 lg:gap-3">
                                {attendanceStudents.length > 0 ? (
                                        <>
                                            <button onClick={() => exportToWord(attendanceStudents, attendanceTotal, group)} className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium border border-gray-200 dark:border-zinc-700 hover:border-blue-300 transition-all">
                                                <Download size={16}/> Экспорт
                                            </button>
                                            {isOwner && Object.keys(attendanceByPeriod).length > 0 && (
                                                <select 
                                                    value={selectedAttendancePeriod || ''} 
                                                    onChange={(e) => {
                                                        const period = parseInt(e.target.value);
                                                        const data = attendanceByPeriod[period];
                                                        if (data && period !== selectedAttendancePeriod) {
                                                            // Save current if modified
                                                            if (selectedAttendancePeriod !== null && isAttendanceModified && attendanceStudents.length > 0) {
                                                                setIsAttendanceSaving(true);
                                                                const toSave = attendanceStudents.map(s => ({
                                                                    ...s,
                                                                    periodMonth: selectedAttendancePeriod
                                                                })) as AttendanceStudent[];
                                                                SaveAttendance(groupId, toSave).then(() => {
                                                                    setAttendanceByPeriod(prev => ({
                                                                        ...prev,
                                                                        [selectedAttendancePeriod]: toSave
                                                                    }));
                                                                    setIsAttendanceSaving(false);
                                                                    setIsAttendanceModified(false);
                                                                });
                                                            }
                                                            // Load new period
                                                            setAttendanceStudents(data);
                                                            setSelectedAttendancePeriod(period);
                                                            setIsAttendanceModified(false);
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-cyan-50 dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400 rounded-lg text-sm font-medium border border-cyan-300 dark:border-cyan-800/50 outline-none transition-all"
                                                >
                                                    <option value="">К другому периоду</option>
                                                    {Object.entries(attendanceByPeriod).map(([period, data]) => (
                                                        <option key={period} value={period}>
                                                            {MONTH_NAMES[parseInt(period) as keyof typeof MONTH_NAMES]} ({data.length} уч.)
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                            {isOwner && (
                                                <>
                                                    <button 
                                                        onClick={() => setShowAttendancePeriodDialog(true)} 
                                                        className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-amber-50 dark:bg-zinc-800 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium rounded-lg text-sm border border-amber-300 dark:border-amber-800/50 transition-all"
                                                    >
                                                        <Calendar size={16}/> Изменить период
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            setIsAttendanceSaving(true);
                                                            const toSave = attendanceStudents.map(s => ({
                                                                ...s,
                                                                periodMonth: selectedAttendancePeriod
                                                            })) as AttendanceStudent[];
                                                            await SaveAttendance(groupId, toSave);
                                                            setNotify({message: "Данные сохранены в БД ✓", type: "success"});
                                                            setIsAttendanceModified(false);
                                                            setIsAttendanceSaving(false);
                                                        }} 
                                                        disabled={isAttendanceSaving}
                                                        className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-medium rounded-lg text-sm transition-all disabled:opacity-50"
                                                    >
                                                        {isAttendanceSaving ? <Loader2 size={16} className="animate-spin" /> : <Database size={16}/>} Сохранить в БД
                                                    </button>
                                                    <button 
                                                        onClick={() => setAttendanceStudents([])} 
                                                        className="flex items-center justify-center gap-2 p-2 bg-red-100 hover:bg-red-600 dark:bg-red-900/20 dark:hover:bg-red-900 text-red-600 hover:text-white dark:text-red-400 rounded-lg transition-colors"
                                                        title="Очистить"
                                                    >
                                                        <Trash2 size={18}/>
                                                        Удалить
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={handleLoadFromDB}
                                                disabled={isAttendanceLoading}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50"
                                            >
                                                {isAttendanceLoading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16}/>}
                                                Загрузить из БД
                                            </button>
                                            {isOwner && Object.keys(attendanceByPeriod).length > 0 && (
                                                <select 
                                                    value={selectedAttendancePeriod || ''} 
                                                    onChange={(e) => {
                                                        const period = parseInt(e.target.value);
                                                        const data = attendanceByPeriod[period];
                                                        if (data) {
                                                            setAttendanceStudents(data);
                                                            setSelectedAttendancePeriod(period);
                                                            setIsAttendanceModified(false);
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-cyan-50 dark:bg-zinc-800 dark:hover:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 rounded-lg text-sm font-medium border border-cyan-300 dark:border-cyan-800/50 outline-none transition-all"
                                                >
                                                    <option value="">Загруженные периоды</option>
                                                    {Object.entries(attendanceByPeriod).map(([period, data]) => (
                                                        <option key={period} value={period}>
                                                            {MONTH_NAMES[parseInt(period) as keyof typeof MONTH_NAMES]} ({data.length} уч.)
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {attendanceStudents.length === 0 ? (
                                isOwner ? (
                                    <motion.label
                                        whileTap={{ scale: 0.99 }}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`shadow-sm flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl cursor-pointer transition-all group ${isDragging ? "border-blue-500 bg-blue-50/50" : "border-gray-100 dark:border-zinc-700 dark:hover:bg-neutral-800 hover:bg-neutral-50"}`}
                                    >
                                        <Upload className={`${isDragging ? "text-blue-500 scale-110" : "text-gray-300 group-hover:text-blue-500"} transition-all mb-4`} size={40} />
                                        <span className="text-sm lg:text-left text-center font-medium text-gray-500">{isDragging ? "Отпустите файл здесь" : "Загрузить отчет по посещаемости или перетащите файл"}</span>
                                        <input type="file" className="hidden" accept=".xls, .xlsx, text/html" onChange={handleAttendanceFileUpload} />
                                    </motion.label>
                                ) : (
                                    <div className="py-20 text-center text-gray-400">Нет данных для отображения</div>
                                )
                            ) : (
                                <div className="w-full overflow-x-auto border border-gray-100 dark:border-zinc-700 rounded-lg shadow-sm">
                                    <table className="text-sm table-auto w-full min-w-150">
                                        <thead className="bg-gray-50/50 dark:bg-zinc-900/50 text-[10px] font-bold uppercase text-gray-400">
                                        <tr className="divide-x divide-gray-100 dark:divide-zinc-700 border-b dark:border-zinc-700">
                                            <th rowSpan={2} className="py-4 w-12 text-center">ID</th>
                                            <th rowSpan={2} className="py-4 px-4 text-left">ФИО</th>
                                            <th colSpan={2} className="py-2 border-b text-center">Дни</th>
                                            <th colSpan={2} className="py-2 border-b text-center">Уроки</th>
                                            <th rowSpan={2} className="py-4 text-center w-20">Опозд.</th>
                                        </tr>
                                        <tr className="divide-x divide-gray-100 dark:divide-zinc-700 border-b dark:border-zinc-700">
                                            <th className="py-2 text-center w-20">Всего</th>
                                            <th className="py-2 text-amber-600 text-center w-20">Болезнь</th>
                                            <th className="py-2 text-center w-20">Всего</th>
                                            <th className="py-2 text-amber-600 text-center w-20">Болезнь</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-zinc-700">
                                        {attendanceStudents.map((s, i) => (
                                            <tr key={i} className="divide-x divide-gray-50 dark:divide-zinc-700 hover:bg-blue-50/10 transition-colors">
                                                <td className="py-3 text-center text-gray-400 font-mono text-[10px]">{s.number}</td>
                                                <td className="px-2 font-medium py-1 hover:bg-gray-100 dark:hover:bg-neutral-600">
                                                    <input
                                                        disabled={!isOwner}
                                                        value={s.fullName}
                                                        onChange={e => updateAttendanceField(i, 'fullName', e.target.value)}
                                                        className="w-full bg-transparent outline-none focus:text-blue-600 disabled:text-gray-700 dark:disabled:text-gray-300"
                                                    />
                                                </td>
                                                <td className="py-3 hover:bg-gray-100 dark:hover:bg-neutral-600">
                                                    <input disabled={!isOwner} value={s.fullDaysTotal} onChange={e => updateAttendanceField(i, 'fullDaysTotal', e.target.value)} className="w-full bg-transparent outline-none disabled:opacity-70 text-center" />
                                                </td>
                                                <td className="py-3 font-bold text-amber-600 hover:bg-gray-100 dark:hover:bg-neutral-600">
                                                    <input disabled={!isOwner} value={s.fullDaysSick} onChange={e => updateAttendanceField(i, 'fullDaysSick', e.target.value)} className="w-full bg-transparent outline-none disabled:opacity-70 text-center" />
                                                </td>
                                                <td className="py-3 hover:bg-gray-100 dark:hover:bg-neutral-600">
                                                    <input disabled={!isOwner} value={s.lessonsTotal} onChange={e => updateAttendanceField(i, 'lessonsTotal', e.target.value)} className="w-full bg-transparent outline-none disabled:opacity-70 text-center"/>
                                                </td>
                                                <td className="py-3 font-bold text-amber-600 hover:bg-gray-100 dark:hover:bg-neutral-600">
                                                    <input disabled={!isOwner} value={s.lessonsSick} onChange={e => updateAttendanceField(i, 'lessonsSick', e.target.value)} className="w-full bg-transparent outline-none disabled:opacity-70 text-center"/>
                                                </td>
                                                <td className="py-3 font-bold text-red-600 hover:bg-gray-100 dark:hover:bg-neutral-600">
                                                    <input disabled={!isOwner} value={s.late} onChange={e => updateAttendanceField(i, 'late', e.target.value)} className="w-full bg-transparent outline-none disabled:opacity-70 text-center" />
                                                </td>
                                            </tr>
                                        ))}
                                        {attendanceTotal && (
                                            <tr className="divide-x divide-gray-100 dark:divide-zinc-700 bg-gray-50 dark:bg-zinc-900 font-bold border-t-2">
                                                <td colSpan={2} className="px-4 py-4 text-[11px] uppercase text-gray-400">Итого:</td>
                                                <td className="px-2 py-4 text-center">{attendanceTotal.fullDaysTotal}</td>
                                                <td className="px-2 py-4 text-amber-600 text-center">{attendanceTotal.fullDaysSick}</td>
                                                <td className="px-2 py-4 text-center">{attendanceTotal.lessonsTotal}</td>
                                                <td className="px-2 py-4 text-amber-600 text-center">{attendanceTotal.lessonsSick}</td>
                                                <td className="px-2 py-4 text-red-600 text-center">{attendanceTotal.late}</td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'grades' && (
                        <div className="w-full bg-card rounded-lg border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-zinc-800 dark:to-zinc-800/50 border-b border-gray-100 dark:border-zinc-700 px-6 py-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-purple-600 text-white rounded-lg"><GraduationCap size={20}/></div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Журнал успеваемости</h2>
                                            {selectedGradesPeriod !== null && (
                                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center mt-0.5">
                                                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                                    <span className="font-medium">{SEMESTER_NAMES[selectedGradesPeriod as keyof typeof SEMESTER_NAMES]}</span>
                                                    {isGradesSaving && <Loader2 className="w-3 h-3 ml-2 animate-spin text-purple-600" />}
                                                    {isGradesModified && <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">Не сохранено</span>}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {gradesStudents.length > 0 && (
                                        <div className="text-right">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                <span className="font-semibold text-gray-900 dark:text-white">{gradesStudents.length}</span> учеников
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/20">
                                <div className="flex sm:flex-row flex-col sm:items-center gap-2 lg:gap-3">
                                    {gradesStudents.length > 0 ? (
                                        <>
                                            <button onClick={() => exportGradesToWord(gradesStudents, group)} className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-purple-50 dark:bg-zinc-800 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium border border-gray-200 dark:border-zinc-700 hover:border-purple-300 transition-all">
                                                <Download size={16}/> Экспорт
                                            </button>
                                            {isOwner && Object.keys(gradesbyPeriod).length > 0 && (
                                                <select 
                                                    value={selectedGradesPeriod || ''} 
                                                    onChange={(e) => {
                                                        const period = parseInt(e.target.value);
                                                        const data = gradesbyPeriod[period];
                                                        if (data && period !== selectedGradesPeriod) {
                                                            // Save current if modified
                                                            if (selectedGradesPeriod !== null && isGradesModified && gradesStudents.length > 0) {
                                                                setIsGradesSaving(true);
                                                                const toSave = gradesStudents.map(s => ({
                                                                    ...s,
                                                                    periodSemester: selectedGradesPeriod
                                                                })) as GradeStudent[];
                                                                SaveGrades(groupId, toSave).then(() => {
                                                                    setGradesbyPeriod(prev => ({
                                                                        ...prev,
                                                                        [selectedGradesPeriod]: toSave
                                                                    }));
                                                                    setIsGradesSaving(false);
                                                                    setIsGradesModified(false);
                                                                });
                                                            }
                                                            // Load new period
                                                            setGradesStudents(data);
                                                            setSelectedGradesPeriod(period);
                                                            setIsGradesModified(false);
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-cyan-50 dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400 rounded-lg text-sm font-medium border border-cyan-300 dark:border-cyan-800/50 outline-none transition-all"
                                                >
                                                    <option value="">К другому периоду</option>
                                                    {Object.entries(gradesbyPeriod).map(([period, data]) => (
                                                        <option key={period} value={period}>
                                                            {SEMESTER_NAMES[parseInt(period) as keyof typeof SEMESTER_NAMES]} ({data.length} уч.)
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                            {isOwner && (
                                                <>
                                                    <button 
                                                        onClick={() => setShowGradesPeriodDialog(true)} 
                                                        className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-amber-50 dark:bg-zinc-800 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium rounded-lg text-sm border border-amber-300 dark:border-amber-800/50 transition-all"
                                                    >
                                                        <Calendar size={16}/> Изменить период
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            setIsGradesSaving(true);
                                                            const toSave = gradesStudents.map(s => ({
                                                                ...s,
                                                                periodSemester: selectedGradesPeriod
                                                            })) as GradeStudent[];
                                                            await SaveGrades(groupId, toSave);
                                                            setNotify({message: "Успеваемость сохранена в БД ✓", type: "success"});
                                                            setIsGradesModified(false);
                                                            setIsGradesSaving(false);
                                                        }} 
                                                        disabled={isGradesSaving}
                                                        className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-medium rounded-lg text-sm transition-all disabled:opacity-50"
                                                    >
                                                        {isGradesSaving ? <Loader2 size={16} className="animate-spin" /> : <Database size={16}/>} Сохранить в БД
                                                    </button>
                                                    <button 
                                                        onClick={() => setGradesStudents([])} 
                                                        className="flex items-center justify-center gap-2 p-2 bg-red-100 hover:bg-red-600 dark:bg-red-900/20 dark:hover:bg-red-900 text-red-600 hover:text-white dark:text-red-400 rounded-lg transition-colors"
                                                        title="Очистить"
                                                    >
                                                        <Trash2 size={18}/>
                                                        Удалить
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={handleLoadGradesFromDB}
                                                disabled={isGradesLoading}
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50"
                                            >
                                                {isGradesLoading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16}/>}
                                                Загрузить из БД
                                            </button>
                                            {isOwner && Object.keys(gradesbyPeriod).length > 0 && (
                                                <select 
                                                    value={selectedGradesPeriod || ''} 
                                                    onChange={(e) => {
                                                        const period = parseInt(e.target.value);
                                                        const data = gradesbyPeriod[period];
                                                        if (data) {
                                                            setGradesStudents(data);
                                                            setSelectedGradesPeriod(period);
                                                            setIsGradesModified(false);
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-cyan-50 dark:bg-zinc-800 dark:hover:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 rounded-lg text-sm font-medium border border-cyan-300 dark:border-cyan-800/50 outline-none transition-all"
                                                >
                                                    <option value="">Загруженные периоды</option>
                                                    {Object.entries(gradesbyPeriod).map(([period, data]) => (
                                                        <option key={period} value={period}>
                                                            {SEMESTER_NAMES[parseInt(period) as keyof typeof SEMESTER_NAMES]} ({data.length} уч.)
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {gradesStudents.length === 0 ? (
                                isOwner ? (
                                    <motion.label
                                        whileTap={{ scale: 0.99 }}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`shadow-sm flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl cursor-pointer transition-all group ${isDraggingGrades ? "border-purple-500 bg-purple-50/50" : "border-gray-100 dark:border-zinc-700 dark:hover:bg-neutral-800 hover:bg-neutral-50"}`}
                                    >
                                        <Upload className={`${isDraggingGrades ? "text-purple-500 scale-110" : "text-gray-300 group-hover:text-purple-500"} transition-all mb-4`} size={40} />
                                        <span className="text-sm lg:text-left text-center font-medium text-gray-500">{isDraggingGrades ? "Отпустите файл здесь" : "Загрузить отчет по успеваемости (Дневник.ру)"}</span>
                                        <input type="file" className="hidden" accept=".xls, .xlsx, text/html" onChange={handleGradesFileUpload} />
                                    </motion.label>
                                ) : (
                                    <div className="py-20 text-center text-gray-400">Данные об успеваемости отсутствуют</div>
                                )
                            ) : (
                                <div className="w-full overflow-x-auto border border-gray-100 dark:border-zinc-700 rounded-lg shadow-sm">
                                    <table className="text-sm table-auto w-full">
                                        <thead className="bg-gray-50/50 dark:bg-zinc-900/50 text-[10px] font-bold uppercase text-gray-400">
                                        <tr className="divide-x divide-gray-100 dark:divide-zinc-700 border-b dark:border-zinc-700">
                                            <th className="py-4 w-10">№</th>
                                            <th className="px-4 min-w-70 text-left">ФИО Студента</th>
                                            <th className="py-4 px-3 bg-purple-50/50 dark:bg-purple-900/20 text-purple-500">Стипендия</th>
                                            <th className="py-4 px-4 min-w-32.5 bg-purple-50/50 dark:bg-purple-900/20 text-purple-500">Средний балл</th>
                                            {gradesStudents[0]?.subjects.map((sub, idx) => (
                                                <th key={idx} className="py-4 px-2 text-center truncate max-w-25" title={sub.name}>
                                                    {sub.name}
                                                </th>
                                            ))}
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-zinc-700">
                                        {gradesStudents.map((student, sIdx) => {
                                            const schol = getScholarshipInfo(student.subjects);
                                            return (
                                                <tr key={sIdx} className="divide-x divide-gray-50 dark:divide-zinc-700 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                                    <td className="p-4 text-center text-gray-400 text-[10px]">{sIdx + 1}</td>

                                                    <td className={`px-4 font-medium py-1 ${schol.color}`}>
                                                        <input
                                                            disabled={!isOwner}
                                                            value={student.fullName}
                                                            onChange={e => {
                                                                const updated = [...gradesStudents];
                                                                updated[sIdx].fullName = e.target.value;
                                                                setGradesStudents(updated);
                                                            }}
                                                            className="w-full bg-transparent outline-none disabled:text-gray-700 dark:disabled:text-gray-200"
                                                        />
                                                    </td>

                                                    <td className="text-center font-bold text-[11px]">
                                                        <span className={`px-2 py-1 rounded-full ${schol.multiplier > 0 ? 'bg-white/50 dark:bg-black/20 shadow-sm' : ''}`}>
                                                            {schol.label}
                                                        </span>
                                                    </td>

                                                    <td className="py-3 text-center font-bold">
                                                        {student.averageScore}
                                                    </td>

                                                    {student.subjects.map((sub, subIdx) => (
                                                        <td key={subIdx} className={`p-0 transition-colors border-x dark:border-zinc-700 ${getGradeColor(sub.grade)}`}>
                                                            <input
                                                                disabled={!isOwner}
                                                                value={sub.grade}
                                                                onChange={(e) => updateGradeField(sIdx, subIdx, e.target.value)}
                                                                className="w-full h-full py-3 text-center bg-transparent outline-none font-bold placeholder:opacity-30"
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <PeriodSelectionDialog
                open={showAttendancePeriodDialog}
                onClose={() => setShowAttendancePeriodDialog(false)}
                onConfirm={handleAttendancePeriodConfirm}
                type="attendance"
                defaultValue={selectedAttendancePeriod || undefined}
            />

            <PeriodSelectionDialog
                open={showGradesPeriodDialog}
                onClose={() => setShowGradesPeriodDialog(false)}
                onConfirm={handleGradesPeriodConfirm}
                type="grades"
                defaultValue={selectedGradesPeriod || undefined}
            />
        </div>
    );
}
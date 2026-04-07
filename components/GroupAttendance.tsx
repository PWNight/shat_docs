"use client"
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Trash2, Upload, FileText, Database, Download, Calendar } from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription, DialogClose
} from "@/components/ui/Dialog";
import PeriodSelectionDialog from "@/components/PeriodSelectionDialog";
import { GetAttendance, SaveAttendance, DeleteAttendancePeriod, CreateStudents } from "@/utils/handlers";
import { exportToWord } from "@/utils/functions";
import { AttendanceStudent, AttendanceTotal, Group, Notify, MONTH_NAMES } from "@/utils/interfaces";

interface GroupAttendanceProps {
    groupId: string;
    group: Group;
    isOwner: boolean;
    setNotify: React.Dispatch<React.SetStateAction<Notify>>;
}

export default function GroupAttendance({ groupId, group, isOwner, setNotify }: GroupAttendanceProps) {
    const isMountedRef = useRef(true);
    const [attendanceStudents, setAttendanceStudents] = useState<AttendanceStudent[]>([]);
    const [attendanceTotal, setAttendanceTotal] = useState<AttendanceTotal>({ fullDaysTotal: 0, fullDaysSick: 0, lessonsTotal: 0, lessonsSick: 0, late: 0 });
    const [attendanceDialogMode, setAttendanceDialogMode] = useState<'load' | 'import'>('load');
    const [showAttendancePeriodDialog, setShowAttendancePeriodDialog] = useState(false);
    const [pendingAttendanceData, setPendingAttendanceData] = useState<AttendanceStudent[] | null>(null);
    const [selectedAttendancePeriod, setSelectedAttendancePeriod] = useState<number | null>(null);
    const [isAttendanceModified, setIsAttendanceModified] = useState(false);
    const [isAttendanceSaving, setIsAttendanceSaving] = useState(false);
    const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
    const [showDeleteAttendanceDialog, setShowDeleteAttendanceDialog] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const total = attendanceStudents.reduce((acc, curr) => ({
            fullDaysTotal: acc.fullDaysTotal + curr.fullDaysTotal,
            fullDaysSick: acc.fullDaysSick + curr.fullDaysSick,
            lessonsTotal: acc.lessonsTotal + curr.lessonsTotal,
            lessonsSick: acc.lessonsSick + curr.lessonsSick,
            late: acc.late + curr.late,
        }), { fullDaysTotal: 0, fullDaysSick: 0, lessonsTotal: 0, lessonsSick: 0, late: 0 });
        setAttendanceTotal(total);
    }, [attendanceStudents]);

    const handleAttendanceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isOwner) return;
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(event.target?.result as string, 'text/html');
            const table = doc.querySelector('table.marks');

            if (!table) {
                setNotify({ message: "Таблица не найдена", type: 'error' });
                return;
            }

            const data: AttendanceStudent[] = Array.from(table.querySelectorAll('tr')).map(row => {
                const cells = Array.from(row.cells);
                if (cells.length < 7 || !/^[0-9]+$/.test(cells[0].textContent?.trim() || '')) return null;

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

            if (!data.length) {
                setNotify({ message: "Файл не содержит корректных строк посещаемости", type: 'warning' });
                return;
            }

            setPendingAttendanceData(data);
            setAttendanceDialogMode('import');
            setShowAttendancePeriodDialog(true);
        };
        reader.readAsText(file);
    };

    const handleAttendancePeriodConfirm = async (period: number) => {
        setShowAttendancePeriodDialog(false);
        setSelectedAttendancePeriod(period);

        if (attendanceDialogMode === 'import' && pendingAttendanceData) {
            const imported = pendingAttendanceData.map(student => ({ ...student, periodMonth: period }));
            setAttendanceStudents(imported);
            setPendingAttendanceData(null);
            setIsAttendanceModified(true);
            setNotify({ message: `Файл готов к сохранению за ${MONTH_NAMES[period as keyof typeof MONTH_NAMES]}`, type: 'success' });
            return;
        }

        setIsAttendanceLoading(true);
        const result = await GetAttendance(groupId, period);
        if (!isMountedRef.current) return;
        setIsAttendanceLoading(false);

        if (result.success && result.data.length > 0) {
            setAttendanceStudents(result.data);
            setIsAttendanceModified(false);
            setNotify({ message: `Загружены данные за ${MONTH_NAMES[period as keyof typeof MONTH_NAMES]}`, type: 'success' });
        } else {
            setAttendanceStudents([]);
            setIsAttendanceModified(false);
            setNotify({ message: `Нет данных за ${MONTH_NAMES[period as keyof typeof MONTH_NAMES]}`, type: 'warning' });
        }
    };

    const handleLoadFromDB = () => {
        setAttendanceDialogMode('load');
        setShowAttendancePeriodDialog(true);
    };

    const openAttendanceDeleteDialog = () => {
        if (!isOwner || selectedAttendancePeriod === null) return;
        setShowDeleteAttendanceDialog(true);
    };

    const handleSaveAttendance = async () => {
        if (!isOwner || selectedAttendancePeriod === null || !attendanceStudents.length) return;

        setIsAttendanceSaving(true);
        const studentsToSave = attendanceStudents.map(student => ({
            ...student,
            periodMonth: selectedAttendancePeriod,
        })) as AttendanceStudent[];

        const result = await SaveAttendance(groupId, studentsToSave);
        if (!isMountedRef.current) return;
        setIsAttendanceSaving(false);

        if (result.success) {
            setIsAttendanceModified(false);
            // Создаем студентов в базе, если их там нет
            const studentNames = attendanceStudents.map(s => ({ fullName: s.fullName }));
            await CreateStudents(groupId, studentNames);
            setNotify({ message: "Посещаемость сохранена в БД", type: 'success' });
        } else {
            setNotify({ message: result.message || "Ошибка записи в БД", type: 'error' });
        }
    };

    const handleDeleteAttendancePeriod = async () => {
        if (!isOwner || selectedAttendancePeriod === null) return;

        setShowDeleteAttendanceDialog(false);
        setIsAttendanceLoading(true);
        const result = await DeleteAttendancePeriod(groupId, selectedAttendancePeriod);
        if (!isMountedRef.current) return;
        setIsAttendanceLoading(false);

        if (result.success) {
            setAttendanceStudents([]);
            setSelectedAttendancePeriod(null);
            setIsAttendanceModified(false);
            setNotify({ message: "Записи за период удалены из БД", type: 'success' });
        } else {
            setNotify({ message: result.message || "Не удалось удалить период", type: 'error' });
        }
    };

    const handleClearAttendance = () => {
        setAttendanceStudents([]);
        setSelectedAttendancePeriod(null);
        setPendingAttendanceData(null);
        setIsAttendanceModified(false);
    };

    const updateAttendanceField = (index: number, field: keyof AttendanceStudent, value: string) => {
        if (!isOwner) return;
        const updated = [...attendanceStudents];
        updated[index] = { ...updated[index], [field]: (field === 'fullName' || field === 'number') ? value : (parseInt(value) || 0) };
        setAttendanceStudents(updated);
        setIsAttendanceModified(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isOwner) return;
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (!isOwner) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const mockEvent = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleAttendanceFileUpload(mockEvent);
        }
    };

    return (
        <div className="w-full bg-card rounded-lg border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
            <div className="bg-linear-to-r from-blue-50 to-cyan-50 dark:from-zinc-800 dark:to-zinc-800/50 border-b border-gray-100 dark:border-zinc-700 px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 text-white rounded-lg"><FileText size={20} /></div>
                        <div>
                            <h2 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">Ведомость посещаемости</h2>
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
                    {attendanceStudents.length > 0 && (
                        <button onClick={() => exportToWord(attendanceStudents, attendanceTotal, group)} className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium border border-gray-200 dark:border-zinc-700 hover:border-blue-300 transition-all">
                            <Download size={16} /> Экспорт
                        </button>
                    )}
                    {attendanceStudents.length === 0 && (
                        <button
                            onClick={handleLoadFromDB}
                            disabled={isAttendanceLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50"
                        >
                            {isAttendanceLoading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />} Загрузить из БД
                        </button>
                    )}
                    {attendanceStudents.length > 0 && (
                        <>
                            <button
                                onClick={handleSaveAttendance}
                                disabled={isAttendanceSaving || selectedAttendancePeriod === null || attendanceStudents.length === 0}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-medium rounded-lg text-sm transition-all disabled:opacity-50"
                            >
                                {isAttendanceSaving ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />} Сохранить в БД
                            </button>
                            <button
                                onClick={openAttendanceDeleteDialog}
                                disabled={selectedAttendancePeriod === null}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-600 dark:bg-red-900/20 dark:hover:bg-red-900 text-red-600 hover:text-white dark:text-red-400 rounded-lg text-sm transition-colors disabled:opacity-50"
                            >
                                <Trash2 size={16} /> Удалить период
                            </button>
                            <button
                                onClick={handleClearAttendance}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium border border-gray-200 dark:border-zinc-700 transition-all"
                            >
                                <Trash2 size={16} /> Очистить
                            </button>
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
                        className={`shadow-sm flex flex-col items-center justify-center py-20 border-2 border-dashed cursor-pointer transition-all group ${isDragging ? "border-blue-500 bg-blue-50/50" : "border-gray-100 dark:border-zinc-700 dark:hover:bg-neutral-800 hover:bg-neutral-50"}`}
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
                                        <input disabled={!isOwner} value={s.lessonsTotal} onChange={e => updateAttendanceField(i, 'lessonsTotal', e.target.value)} className="w-full bg-transparent outline-none disabled:opacity-70 text-center" />
                                    </td>
                                    <td className="py-3 font-bold text-amber-600 hover:bg-gray-100 dark:hover:bg-neutral-600">
                                        <input disabled={!isOwner} value={s.lessonsSick} onChange={e => updateAttendanceField(i, 'lessonsSick', e.target.value)} className="w-full bg-transparent outline-none disabled:opacity-70 text-center" />
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

            <Dialog open={showDeleteAttendanceDialog} onOpenChange={setShowDeleteAttendanceDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить период посещаемости</DialogTitle>
                        <DialogDescription>
                            Вы уверены, что хотите удалить записи посещаемости за {selectedAttendancePeriod !== null ? MONTH_NAMES[selectedAttendancePeriod as keyof typeof MONTH_NAMES] : 'выбранный период'} из базы данных? Это действие нельзя отменить.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3">
                        <button
                            onClick={handleDeleteAttendancePeriod}
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

            <PeriodSelectionDialog
                open={showAttendancePeriodDialog}
                onClose={() => {
                    setShowAttendancePeriodDialog(false);
                    setPendingAttendanceData(null);
                }}
                onConfirm={handleAttendancePeriodConfirm}
                type="attendance"
                defaultValue={selectedAttendancePeriod || undefined}
            />
        </div>
    );
}

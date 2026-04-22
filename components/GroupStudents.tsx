"use client";
import React, { useEffect, useRef, useState } from "react";
import { Edit, Trash2, Save, X, User, Loader2, RefreshCw } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/Dialog";
import { GetAttendance, GetGrades, GetStudents, UpdateStudent, DeleteStudent } from "@/utils/handlers";
import { exportGradesToWord, exportToWord } from "@/utils/functions";
import { Group, Notify, Student, MONTH_NAMES, SEMESTER_NAMES, AttendanceStudent, AttendanceTotal, GradeStudent } from "@/utils/interfaces";
import { getDbOfflineToastMessage, isDbOfflineMeta } from "@/utils/ui-errors";

// Интерфейс для компонента GroupStudents
interface GroupStudentsProps {
    groupId: string;
    groupName: string;
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    isOwner: boolean;
    setNotify: (notify: Notify) => void;
}

export default function GroupStudents({ groupId, groupName, students, setStudents, isOwner, setNotify }: GroupStudentsProps) {
    // Используем useRef для отслеживания монтирования компонента       
    const isMountedRef = useRef(true);
    // Используем useState для отслеживания студента, которого редактируем
    const [editingStudent, setEditingStudent] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [deleteStudentId, setDeleteStudentId] = useState<number | null>(null);
    // Используем useState для отслеживания удаления студента
    const [isDeleting, setIsDeleting] = useState(false);
    // Используем useState для отслеживания обновления списка студентов
    const [isRefreshing, setIsRefreshing] = useState(false);
    // Используем useState для отслеживания выбранных студентов
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    // Используем useState для отслеживания типа отчёта
    const [reportType, setReportType] = useState<'attendance' | 'grades'>('attendance');
    // Используем useState для отслеживания периода отчёта
    const [reportPeriod, setReportPeriod] = useState<number | null>(null);
    // Используем useState для отслеживания генерации отчёта
    const [isGenerating, setIsGenerating] = useState(false);

    // Используем useEffect для отслеживания монтирования компонента
    useEffect(() => {
        // Устанавливаем флаг монтирования компонента
        isMountedRef.current = true;
        // Возвращаем функцию для отслеживания размонтирования компонента
        return () => {
            // Устанавливаем флаг размонтирования компонента
            isMountedRef.current = false;
        };
    }, []);

    // Получаем список выбранных студентов  
    const selectedStudents = students.filter(student => selectedStudentIds.includes(student.id));
    // Получаем список имён выбранных студентов
    const selectedStudentNames = selectedStudents.map(student => student.full_name);
    // Получаем список периодов отчёта
    const reportPeriods = reportType === 'attendance'
        ? Object.entries(MONTH_NAMES).map(([key, label]) => ({ value: Number(key), label }))
        : Object.entries(SEMESTER_NAMES).map(([key, label]) => ({ value: Number(key), label }));

    // Функция для переключения выбора студента
    const toggleStudentSelection = (id: number) => {
        setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    // Функция для переключения выбора всех студентов
    const toggleSelectAll = () => {
        setSelectedStudentIds(prev => prev.length === students.length ? [] : students.map(student => student.id));
    };

    // Функция для генерации отчёта
    const generateReport = async () => {
        // Проверяем, что выбран период и что выбраны студенты
        if (!reportPeriod || selectedStudentIds.length === 0) {
            // Устанавливаем уведомление о ошибке выбора студентов и периода
            setNotify({ message: 'Выберите студентов и период для отчёта', type: 'warning' });
            return;
        }

        // Устанавливаем флаг генерации отчёта
        setIsGenerating(true);

        try {
            // Проверяем, что тип отчёта посещаемость
            if (reportType === 'attendance') {
                // Получаем данные посещаемости
                const attendanceRes = await GetAttendance(groupId, reportPeriod);
                // Проверяем, что данные посещаемости успешно загружены
                if (!attendanceRes.success) {
                    // Проверяем, что ошибка вызвана отсутствием интернета
                    const dbOffline = isDbOfflineMeta(attendanceRes.status, attendanceRes.code);
                    // Устанавливаем уведомление о ошибке загрузки посещаемости
                    setNotify({
                        message: dbOffline ? getDbOfflineToastMessage() : (attendanceRes.message || 'Ошибка загрузки посещаемости'),
                        type: dbOffline ? 'warning' : 'error',
                    });
                    return;
                }

                // Проверяем, что данные посещаемости не пустые
                if (!attendanceRes.data) {
                    // Устанавливаем уведомление о ошибке загрузки посещаемости
                    setNotify({ message: 'Ошибка загрузки посещаемости', type: 'error' });
                    return;
                }

                // Получаем список студентов для отчёта
                const reportStudents = attendanceRes.data.filter((item: AttendanceStudent) => selectedStudentNames.includes(item.fullName));
                // Проверяем, что данные посещаемости для выбранных студентов не пустые
                if (!reportStudents.length) {
                    // Устанавливаем уведомление о ошибке загрузки посещаемости для выбранных студентов
                    setNotify({ message: 'Нет данных посещаемости для выбранных студентов', type: 'warning' });
                    return;
                }

                // Получаем общую информацию о посещаемости
                const total = reportStudents.reduce((acc: AttendanceTotal, student: AttendanceStudent) => ({
                    fullDaysTotal: acc.fullDaysTotal + Number(student.fullDaysTotal || 0),
                    fullDaysSick: acc.fullDaysSick + Number(student.fullDaysSick || 0),
                    lessonsTotal: acc.lessonsTotal + Number(student.lessonsTotal || 0),
                    lessonsSick: acc.lessonsSick + Number(student.lessonsSick || 0),
                    late: acc.late + Number(student.late || 0),
                }), {
                    fullDaysTotal: 0,
                    fullDaysSick: 0,
                    lessonsTotal: 0,
                    lessonsSick: 0,
                    late: 0,
                });

                // Экспортируем данные посещаемости в Word
                await exportToWord(reportStudents, total, {
                    id: 0,
                    name: groupName,
                    fk_user: 0,
                    leader: '',
                    created_by: '',
                } as Group);

                // Устанавливаем уведомление о успешном формировании отчёта по посещаемости
                setNotify({ message: 'Отчёт по посещаемости сформирован', type: 'success' });
            } else {
                // Получаем данные успеваемости
                const gradesRes = await GetGrades(groupId, reportPeriod);
                // Проверяем, что данные успеваемости успешно загружены
                if (!gradesRes.success) {
                    // Проверяем, что ошибка вызвана отсутствием интернета
                    const dbOffline = isDbOfflineMeta(gradesRes.status, gradesRes.code);
                    // Устанавливаем уведомление о ошибке загрузки успеваемости
                    setNotify({
                        message: dbOffline ? getDbOfflineToastMessage() : (gradesRes.message || 'Ошибка загрузки успеваемости'),
                        type: dbOffline ? 'warning' : 'error',
                    });
                    return;
                }

                // Проверяем, что данные успеваемости не пустые
                if (!gradesRes.data) {
                    // Устанавливаем уведомление о ошибке загрузки успеваемости
                    setNotify({ message: 'Ошибка загрузки успеваемости', type: 'error' });
                    return;
                }

                // Получаем список студентов для отчёта
                const reportStudents = gradesRes.data.filter((item: GradeStudent) => selectedStudentNames.includes(item.fullName));
                // Проверяем, что данные успеваемости для выбранных студентов не пустые
                if (!reportStudents.length) {
                    // Устанавливаем уведомление о ошибке загрузки успеваемости для выбранных студентов
                    setNotify({ message: 'Нет данных успеваемости для выбранных студентов', type: 'warning' });
                    return;
                }

                // Экспортируем данные успеваемости в Word
                await exportGradesToWord(reportStudents, {
                    id: 0,
                    name: groupName,
                    fk_user: 0,
                    leader: '',
                    created_by: '',
                } as Group);

                // Устанавливаем уведомление о успешном формировании отчёта по успеваемости
                setNotify({ message: 'Отчёт по успеваемости сформирован', type: 'success' });
            }
        } catch (error) {
            setNotify({ message: error instanceof Error ? error.message : 'Ошибка при формировании отчёта', type: 'error' });
        } finally {
            if (isMountedRef.current) {
                setIsGenerating(false);
            }
        }
    };

    // Функция для редактирования студента
    const handleEdit = (student: Student) => {
        // Устанавливаем флаг редактирования студента
        setEditingStudent(student.id);
        // Устанавливаем имя студента
        setEditName(student.full_name);
    };

    // Функция для сохранения изменений в студенте
    const handleSave = async () => {
        // Проверяем, что студент редактируется
        if (!editingStudent) return;

        // Обновляем студента
        const result = await UpdateStudent(groupId, editingStudent, editName);
        // Проверяем, что студент успешно обновлен
        if (result.success) {
            // Обновляем список студентов   
            setStudents(prev => prev.map(s => s.id === editingStudent ? { ...s, full_name: editName } : s));
            // Устанавливаем уведомление о успешном переименовании студента
            setNotify({ message: "Студент переименован", type: 'success' });
        } else {
            // Проверяем, что ошибка вызвана отсутствием интернета
            const dbOffline = isDbOfflineMeta(result.status, result.code);
            // Устанавливаем уведомление о ошибке переименования студента
            setNotify({
                message: dbOffline ? getDbOfflineToastMessage() : (result.message || "Ошибка переименования"),
                type: dbOffline ? "warning" : "error",
            });
        }

        // Устанавливаем флаг редактирования студента
        setEditingStudent(null);
    };

    // Функция для удаления студента
    const handleDelete = async () => {
        // Проверяем, что студент удаляется и что флаг удаления не установлен
        if (!deleteStudentId || isDeleting) return;
        // Устанавливаем флаг удаления студента

        setIsDeleting(true);
        // Удаляем студента
        const result = await DeleteStudent(groupId, deleteStudentId);
        // Проверяем, что компонент монтирован
        if (!isMountedRef.current) return;
        // Устанавливаем флаг удаления студента
        setIsDeleting(false);
        // Проверяем, что студент успешно удален
        if (result.success) {
            // Обновляем список студентов
            setStudents(prev => prev.filter(s => s.id !== deleteStudentId));
            // Устанавливаем уведомление о успешном удалении студента
            setNotify({ message: "Студент удален", type: 'success' });
        } else {
            // Проверяем, что ошибка вызвана отсутствием интернета
            const dbOffline = isDbOfflineMeta(result.status, result.code);
            // Устанавливаем уведомление о ошибке удаления студента
            setNotify({
                message: dbOffline ? getDbOfflineToastMessage() : (result.message || "Ошибка удаления"),
                type: dbOffline ? "warning" : "error",
            });
        }

        // Устанавливаем id студента для удаления
        setDeleteStudentId(null);
    };

    // Функция для обновления списка студентов
    const refreshStudents = async () => {
        // Устанавливаем флаг обновления списка студентов
        setIsRefreshing(true);
        // Получаем список студентов
        const result = await GetStudents(groupId);
        // Проверяем, что компонент монтирован
        if (!isMountedRef.current) return;
        // Устанавливаем флаг обновления списка студентов
        setIsRefreshing(false);
        if (!result.success) {
            // Проверяем, что ошибка вызвана отсутствием интернета
            const dbOffline = isDbOfflineMeta(result.status, result.code);
            // Устанавливаем уведомление о ошибке обновления списка студентов
            setNotify({
                message: dbOffline ? getDbOfflineToastMessage() : (result.message || "Ошибка обновления списка"),
                type: dbOffline ? "warning" : "error",
            });
            return;
        }

        // Проверяем, что данные студентов не пустые
        if (!result.data) {
            // Устанавливаем уведомление о ошибке обновления списка студентов
            setNotify({ message: result.message || "Ошибка обновления списка", type: "error" });
            return;
        }

        // Обновляем список студентов
        setStudents(result.data);
        // Устанавливаем уведомление о успешном обновлении списка студентов
        setNotify({ message: "Список студентов обновлен", type: "success" });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-lg font-semibold text-foreground">Управление студентами</h3>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    <span className="text-sm text-muted-foreground">{students.length} студентов</span>
                    <button
                        onClick={refreshStudents}
                        disabled={isRefreshing}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-1 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Обновить список студентов"
                    >
                        <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                        Обновить
                    </button>
                </div>
            </div>

            <div className="rounded-3xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h4 className="text-base font-semibold text-foreground">Генерация отчёта</h4>
                        <p className="text-sm text-muted-foreground">Выберите студентов, тип отчёта и период для экспорта.</p>
                    </div>
                    <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition dark:border-blue-900 dark:bg-zinc-950 dark:text-blue-300"
                    >
                        {selectedStudentIds.length === students.length ? 'Снять выбор' : 'Выбрать всех'}
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                        Тип отчёта
                        <select
                            value={reportType}
                            onChange={(e) => { setReportType(e.target.value as 'attendance' | 'grades'); setReportPeriod(null); }}
                            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition dark:border-zinc-700 dark:bg-zinc-950"
                        >
                            <option value="attendance">Посещаемость</option>
                            <option value="grades">Успеваемость</option>
                        </select>
                    </label>

                    <label className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                        Период
                        <select
                            value={reportPeriod ?? ''}
                            onChange={(e) => setReportPeriod(Number(e.target.value) || null)}
                            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition dark:border-zinc-700 dark:bg-zinc-950"
                        >
                            <option value="">Выберите период</option>
                            {reportPeriods.map(period => (
                                <option key={period.value} value={period.value}>{period.label}</option>
                            ))}
                        </select>
                    </label>

                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                        <span className="block font-medium">Выбрано студентов</span>
                        <p className="text-sm text-muted-foreground">{selectedStudentIds.length} из {students.length}</p>
                    </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 max-h-52 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950">
                    {students.map(student => (
                        <label
                            key={student.id}
                            className="inline-flex w-full cursor-pointer items-center gap-2 rounded-xl border border-transparent px-3 py-2 transition hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:bg-blue-950"
                        >
                            <input
                                type="checkbox"
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={() => toggleStudentSelection(student.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="truncate">{student.full_name}</span>
                        </label>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={generateReport}
                    disabled={isGenerating || selectedStudentIds.length === 0 || reportPeriod === null}
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? 'Формирование...' : 'Скачать отчёт'}
                </button>
            </div>

            {students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-lg">
                    <User className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                        Студенты появятся здесь после первого импорта посещаемости или успеваемости
                    </p>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {students.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-4 bg-card border border-gray-100 dark:border-zinc-700 rounded-lg">
                            <div className="flex-1">
                                {editingStudent === student.id ? (
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-background"
                                        autoFocus
                                    />
                                ) : (
                                    <span className="text-foreground font-medium">{student.full_name}</span>
                                )}
                            </div>
                            {isOwner && (
                                <div className="flex items-center gap-2">
                                    {editingStudent === student.id ? (
                                        <>
                                            <button
                                                onClick={handleSave}
                                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md"
                                            >
                                                <Save size={16} />
                                            </button>
                                            <button
                                                onClick={() => setEditingStudent(null)}
                                                className="p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                                            >
                                                <X size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleEdit(student)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <button
                                                        onClick={() => setDeleteStudentId(student.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Удаление студента</DialogTitle>
                                                        <DialogDescription className="pt-2">
                                                            Вы действительно хотите удалить студента «{student.full_name}»?<br />
                                                            Это также удалит все его записи посещаемости и успеваемости.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <DialogFooter className="gap-3 sm:gap-4">
                                                        <button
                                                            onClick={handleDelete}
                                                            disabled={isDeleting}
                                                            className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                        >
                                                            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : null}
                                                            {isDeleting ? "Удаление..." : "Да, удалить"}
                                                        </button>
                                                        <DialogClose className="flex-1 bg-gray-200 dark:bg-zinc-700 py-3 rounded-lg font-medium">
                                                            Отмена
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
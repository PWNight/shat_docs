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
import { getDbOfflineToastMessage, isDbOfflineMeta } from "@/utils/ui-errors";

// Интерфейс для компонента GroupAttendance
interface GroupAttendanceProps {
    groupId: string;
    group: Group;
    isOwner: boolean;
    setNotify: React.Dispatch<React.SetStateAction<Notify>>;
}

export default function GroupAttendance({ groupId, group, isOwner, setNotify }: GroupAttendanceProps) {
    // Флаг для отслеживания монтирования компонента
    const isMountedRef = useRef(true);
    // Список студентов посещаемости
    const [attendanceStudents, setAttendanceStudents] = useState<AttendanceStudent[]>([]);
    // Общее количество дней посещаемости
    const [attendanceTotal, setAttendanceTotal] = useState<AttendanceTotal>({ fullDaysTotal: 0, fullDaysSick: 0, lessonsTotal: 0, lessonsSick: 0, late: 0 });
    // Режим диалога посещаемости
    const [attendanceDialogMode, setAttendanceDialogMode] = useState<'load' | 'import'>('load');
    // Флаг для отслеживания открытия диалога посещаемости
    const [showAttendancePeriodDialog, setShowAttendancePeriodDialog] = useState(false);
    // Данные посещаемости для импорта
    const [pendingAttendanceData, setPendingAttendanceData] = useState<AttendanceStudent[] | null>(null);
    // Выбранный период посещаемости
    const [selectedAttendancePeriod, setSelectedAttendancePeriod] = useState<number | null>(null);
    // Флаг для отслеживания изменений посещаемости
    const [isAttendanceModified, setIsAttendanceModified] = useState(false);
    // Флаг для отслеживания сохранения посещаемости
    const [isAttendanceSaving, setIsAttendanceSaving] = useState(false);
    // Флаг для отслеживания загрузки посещаемости
    const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
    // Флаг для отслеживания открытия диалога удаления посещаемости
    const [showDeleteAttendanceDialog, setShowDeleteAttendanceDialog] = useState(false);
    // Флаг для отслеживания перетаскивания файла
    const [isDragging, setIsDragging] = useState(false);

    // Эффект для отслеживания монтирования компонента
    useEffect(() => {
        // Устанавливаем флаг монтирования компонента
        isMountedRef.current = true;
        // Возвращаем функцию для отслеживания размонтирования компонента
        return () => {
            // Устанавливаем флаг размонтирования компонента
            isMountedRef.current = false;
        };
    }, []);

    // Эффект для расчета общего количества дней посещаемости
    useEffect(() => {
        // Рассчитываем общее количество дней посещаемости
        const total = attendanceStudents.reduce((acc, curr) => ({
            fullDaysTotal: acc.fullDaysTotal + curr.fullDaysTotal,
            fullDaysSick: acc.fullDaysSick + curr.fullDaysSick,
            lessonsTotal: acc.lessonsTotal + curr.lessonsTotal,
            lessonsSick: acc.lessonsSick + curr.lessonsSick,
            late: acc.late + curr.late,
        }), { fullDaysTotal: 0, fullDaysSick: 0, lessonsTotal: 0, lessonsSick: 0, late: 0 });
        setAttendanceTotal(total);
    }, [attendanceStudents]);

    // Функция для обработки загрузки файла посещаемости
    const handleAttendanceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Проверяем, что пользователь имеет доступ к группе
        if (!isOwner) return;
        // Получаем файл
        const file = e.target.files?.[0];
        // Проверяем, что файл существует
        if (!file) return;

        // Создаем новый FileReader
        const reader = new FileReader();
        reader.onload = (event) => {
            // Создаем новый DOMParser
            const parser = new DOMParser();
            // Парсим HTML-код
            const doc = parser.parseFromString(event.target?.result as string, 'text/html');
            // Получаем таблицу посещаемости
            const table = doc.querySelector('table.marks');

            // Проверяем, что таблица существует
            if (!table) {
                // Устанавливаем уведомление об ошибке
                setNotify({ message: "Таблица не найдена", type: 'error' });
                // Возвращаем
                return;
            }

            // Получаем данные посещаемости
            const data: AttendanceStudent[] = Array.from(table.querySelectorAll('tr')).map(row => {
                // Получаем ячейки строки
                const cells = Array.from(row.cells);
                // Проверяем, что строка содержит достаточно ячеек и что первая ячейка содержит число
                if (cells.length < 7 || !/^[0-9]+$/.test(cells[0].textContent?.trim() || '')) return null;

                // Возвращаем данные посещаемости
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

            // Проверяем, что данные посещаемости не пусты
            if (!data.length) {
                setNotify({ message: "Файл не содержит корректных строк посещаемости", type: 'warning' });
                return;
            }

            // Устанавливаем данные посещаемости для импорта
            setPendingAttendanceData(data);
            // Устанавливаем режим диалога посещаемости
            setAttendanceDialogMode('import');
            // Устанавливаем флаг открытия диалога посещаемости
            setShowAttendancePeriodDialog(true);
        };
        reader.readAsText(file);
    };

    // Функция для обработки подтверждения периода посещаемости
    const handleAttendancePeriodConfirm = async (period: number) => {
        // Закрываем диалог посещаемости
        setShowAttendancePeriodDialog(false);
        // Устанавливаем выбранный период посещаемости
        setSelectedAttendancePeriod(period);

        // Проверяем, что режим диалога посещаемости импорт и что данные посещаемости для импорта существуют
        if (attendanceDialogMode === 'import' && pendingAttendanceData) {
            // Создаем новый список студентов посещаемости
            const imported = pendingAttendanceData.map(student => ({ ...student, periodMonth: period }));
            // Устанавливаем список студентов посещаемости
            setAttendanceStudents(imported);
            // Устанавливаем данные посещаемости для импорта
            setPendingAttendanceData(null);
            // Устанавливаем флаг изменений посещаемости
            setIsAttendanceModified(true);
            // Устанавливаем уведомление о успешном импорте
            setNotify({ message: `Файл готов к сохранению за ${MONTH_NAMES[period as keyof typeof MONTH_NAMES]}`, type: 'success' });
            return;
        }

        // Устанавливаем флаг загрузки посещаемости
        setIsAttendanceLoading(true);
        try {
            // Получаем данные посещаемости из БД
            const result = await GetAttendance(groupId, period);
            // Проверяем, что компонент монтирован
            if (!isMountedRef.current) return;

            // Проверяем, что данные посещаемости успешно загружены
            if (result.success && result.data && result.data.length > 0) {
                // Устанавливаем список студентов посещаемости
                setAttendanceStudents(result.data);
                // Устанавливаем флаг изменений посещаемости
                setIsAttendanceModified(false);
                // Устанавливаем уведомление о успешной загрузке
                setNotify({ message: `Загружены данные за ${MONTH_NAMES[period as keyof typeof MONTH_NAMES]}`, type: "success" });
            } else if (!result.success) {
                // Проверяем, что ошибка вызвана отсутствием интернета
                const dbOffline = isDbOfflineMeta(result.status, result.code);
                // Устанавливаем список студентов посещаемости
                setAttendanceStudents([]);
                // Устанавливаем флаг изменений посещаемости
                setIsAttendanceModified(false);
                // Устанавливаем уведомление о ошибке загрузки
                setNotify({
                    message: dbOffline ? getDbOfflineToastMessage() : (result.message || "Ошибка загрузки посещаемости"),
                    type: dbOffline ? "warning" : "error",
                });
            } else {
                // Устанавливаем список студентов посещаемости
                setAttendanceStudents([]);
                // Устанавливаем флаг изменений посещаемости
                setIsAttendanceModified(false);
                // Устанавливаем уведомление о отсутствии данных
                setNotify({ message: `Нет данных за ${MONTH_NAMES[period as keyof typeof MONTH_NAMES]}`, type: "warning" });
            }
        } catch (error) {
            // Проверяем, что компонент монтирован
            if (!isMountedRef.current) return;
            // Устанавливаем уведомление о ошибке загрузки
            setNotify({ message: error instanceof Error ? error.message : "Ошибка загрузки посещаемости", type: "error" });
        } finally {
            // Проверяем, что компонент монтирован
            if (isMountedRef.current) {
                // Устанавливаем флаг загрузки посещаемости
                setIsAttendanceLoading(false);
            }
        }
    };

    // Функция для обработки загрузки данных посещаемости из БД
    const handleLoadFromDB = () => {
        // Устанавливаем режим диалога посещаемости
        setAttendanceDialogMode('load');
        // Устанавливаем флаг открытия диалога посещаемости
        setShowAttendancePeriodDialog(true);
    };

    // Функция для обработки открытия диалога удаления посещаемости
    const openAttendanceDeleteDialog = () => {
        // Проверяем, что пользователь имеет доступ к группе и что выбран период посещаемости
        if (!isOwner || selectedAttendancePeriod === null) return;
        // Устанавливаем флаг открытия диалога удаления посещаемости
        setShowDeleteAttendanceDialog(true);
    };

    // Функция для обработки сохранения посещаемости
    const handleSaveAttendance = async () => {
        // Проверяем, что пользователь имеет доступ к группе и что выбран период посещаемости и что список студентов посещаемости не пуст
        if (!isOwner || selectedAttendancePeriod === null || !attendanceStudents.length) return;

        // Устанавливаем флаг сохранения посещаемости
        setIsAttendanceSaving(true);
        // Создаем новый список студентов посещаемости
        const studentsToSave = attendanceStudents.map(student => ({
            ...student,
            periodMonth: selectedAttendancePeriod,
        })) as AttendanceStudent[];

        // Сохраняем данные посещаемости в БД
        const result = await SaveAttendance(groupId, studentsToSave);
        // Проверяем, что компонент монтирован
        if (!isMountedRef.current) return;
        // Устанавливаем флаг сохранения посещаемости
        setIsAttendanceSaving(false);

        if (result.success) {
            // Устанавливаем флаг изменений посещаемости
            setIsAttendanceModified(false);
            // Создаем студентов в базе, если их там нет
            const studentNames = attendanceStudents.map(s => ({ fullName: s.fullName }));
            // Создаем студентов в базе
            await CreateStudents(groupId, studentNames);
            // Устанавливаем уведомление о успешном сохранении
            setNotify({ message: "Посещаемость сохранена в БД", type: 'success' });
        } else {
            // Проверяем, что ошибка вызвана отсутствием интернета
            const dbOffline = isDbOfflineMeta(result.status, result.code);
            // Устанавливаем уведомление о ошибке сохранения
            setNotify({
                message: dbOffline ? getDbOfflineToastMessage() : (result.message || "Ошибка записи в БД"),
                type: dbOffline ? "warning" : "error",
            });
        }
    };

    // Функция для обработки удаления периода посещаемости
    const handleDeleteAttendancePeriod = async () => {
        // Проверяем, что пользователь имеет доступ к группе и что выбран период посещаемости
        if (!isOwner || selectedAttendancePeriod === null) return;

        // Закрываем диалог удаления посещаемости
        setShowDeleteAttendanceDialog(false);
        // Устанавливаем флаг загрузки посещаемости
        setIsAttendanceLoading(true);

        // Удаляем данные посещаемости из БД
        const result = await DeleteAttendancePeriod(groupId, selectedAttendancePeriod);
        // Проверяем, что компонент монтирован
        if (!isMountedRef.current) return;
        // Устанавливаем флаг загрузки посещаемости
        setIsAttendanceLoading(false);

        // Проверяем, что данные посещаемости успешно удалены
        if (result.success) {
            // Устанавливаем список студентов посещаемости
            setAttendanceStudents([]);
            // Устанавливаем выбранный период посещаемости
            setSelectedAttendancePeriod(null);
            // Устанавливаем флаг изменений посещаемости
            setIsAttendanceModified(false);
            // Устанавливаем уведомление о успешном удалении
            setNotify({ message: "Записи за период удалены из БД", type: 'success' });
        } else {
            // Проверяем, что ошибка вызвана отсутствием интернета
            const dbOffline = isDbOfflineMeta(result.status, result.code);
            // Устанавливаем уведомление о ошибке удаления
            setNotify({
                message: dbOffline ? getDbOfflineToastMessage() : (result.message || "Не удалось удалить период"),
                type: dbOffline ? "warning" : "error",
            });
        }
    };

    // Функция для обработки очистки посещаемости
    const handleClearAttendance = () => {
        // Устанавливаем список студентов посещаемости
        setAttendanceStudents([]);
        // Устанавливаем выбранный период посещаемости
        setSelectedAttendancePeriod(null);
        // Устанавливаем данные посещаемости для импорта
        setPendingAttendanceData(null);
        // Устанавливаем флаг изменений посещаемости
        setIsAttendanceModified(false);
    };

    // Функция для обработки обновления поля посещаемости
    const updateAttendanceField = (index: number, field: keyof AttendanceStudent, value: string) => {
        // Проверяем, что пользователь имеет доступ к группе
        if (!isOwner) return;
        // Создаем новый список студентов посещаемости
        const updated = [...attendanceStudents];
        // Обновляем поле посещаемости
        updated[index] = { ...updated[index], [field]: (field === 'fullName' || field === 'number') ? value : (parseInt(value) || 0) };
        // Устанавливаем список студентов посещаемости
        setAttendanceStudents(updated);
        // Устанавливаем флаг изменений посещаемости
        setIsAttendanceModified(true);
    };

    // Функция для обработки перетаскивания файла
    const handleDragOver = (e: React.DragEvent) => {
        // Предотвращаем стандартное поведение перетаскивания
        e.preventDefault();
        // Предотвращаем распространение перетаскивания
        e.stopPropagation();
        // Проверяем, что пользователь имеет доступ к группе
        if (!isOwner) return;
        // Устанавливаем флаг перетаскивания
        setIsDragging(true);
    };

    // Функция для обработки выхода из зоны перетаскивания
    const handleDragLeave = (e: React.DragEvent) => {
        // Предотвращаем стандартное поведение выхода из зоны перетаскивания
        e.preventDefault();
        // Предотвращаем распространение выхода из зоны перетаскивания
        e.stopPropagation();
        // Устанавливаем флаг перетаскивания
        setIsDragging(false);
    };

    // Функция для обработки перетаскивания файла
    const handleDrop = (e: React.DragEvent) => {
        // Предотвращаем стандартное поведение перетаскивания
        e.preventDefault();
        // Предотвращаем распространение перетаскивания
        e.stopPropagation();
        // Устанавливаем флаг перетаскивания
        setIsDragging(false);
        // Проверяем, что пользователь имеет доступ к группе
        if (!isOwner) return;
        // Получаем файлы из перетаскивания
        const files = e.dataTransfer.files;
        // Проверяем, что файлы существуют и что их количество больше 0
        if (files && files.length > 0) {
            // Создаем mock-событие для обработки файла
            const mockEvent = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>;
            // Обрабатываем файл посещаемости
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
                                            className="editable-cell-input text-left focus:text-blue-600 disabled:text-gray-700 dark:disabled:text-gray-300"
                                        />
                                    </td>
                                    <td className="py-3 hover:bg-gray-100 dark:hover:bg-neutral-600">
                                        <input disabled={!isOwner} value={s.fullDaysTotal} onChange={e => updateAttendanceField(i, 'fullDaysTotal', e.target.value)} className="editable-cell-input" />
                                    </td>
                                    <td className="py-3 font-bold text-amber-600 hover:bg-gray-100 dark:hover:bg-neutral-600">
                                        <input disabled={!isOwner} value={s.fullDaysSick} onChange={e => updateAttendanceField(i, 'fullDaysSick', e.target.value)} className="editable-cell-input" />
                                    </td>
                                    <td className="py-3 hover:bg-gray-100 dark:hover:bg-neutral-600">
                                        <input disabled={!isOwner} value={s.lessonsTotal} onChange={e => updateAttendanceField(i, 'lessonsTotal', e.target.value)} className="editable-cell-input" />
                                    </td>
                                    <td className="py-3 font-bold text-amber-600 hover:bg-gray-100 dark:hover:bg-neutral-600">
                                        <input disabled={!isOwner} value={s.lessonsSick} onChange={e => updateAttendanceField(i, 'lessonsSick', e.target.value)} className="editable-cell-input" />
                                    </td>
                                    <td className="py-3 font-bold text-red-600 hover:bg-gray-100 dark:hover:bg-neutral-600">
                                        <input disabled={!isOwner} value={s.late} onChange={e => updateAttendanceField(i, 'late', e.target.value)} className="editable-cell-input" />
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
                            className="dialog-danger-btn"
                        >
                            Да, удалить
                        </button>
                        <DialogClose className="dialog-cancel-btn">
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

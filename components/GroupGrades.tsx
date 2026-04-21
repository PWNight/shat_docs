"use client"
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Trash2, Upload, Database, Download, Calendar, GraduationCap } from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription, DialogClose
} from "@/components/ui/Dialog";
import PeriodSelectionDialog from "@/components/PeriodSelectionDialog";
import { GetGrades, SaveGrades, DeleteGradesPeriod, CreateStudents } from "@/utils/handlers";
import { exportGradesToWord } from "@/utils/functions";
import { Group, GradeStudent, Notify, SEMESTER_NAMES } from "@/utils/interfaces";
import { getDbOfflineToastMessage, isDbOfflineMeta } from "@/utils/ui-errors";

// Интерфейс для компонента GroupGrades
interface GroupGradesProps {
    groupId: string;
    group: Group;
    isOwner: boolean;
    setNotify: React.Dispatch<React.SetStateAction<Notify>>;
}

export default function GroupGrades({ groupId, group, isOwner, setNotify }: GroupGradesProps) {
    // Используем useRef для отслеживания монтирования компонента
    const isMountedRef = useRef(true);
    // Используем useState для отслеживания списка студентов успеваемости
    const [gradesStudents, setGradesStudents] = useState<GradeStudent[]>([]);
    // Используем useState для отслеживания режима диалога успеваемости
    const [gradesDialogMode, setGradesDialogMode] = useState<'load' | 'import'>('load');
    // Используем useState для отслеживания открытия диалога успеваемости
    const [showGradesPeriodDialog, setShowGradesPeriodDialog] = useState(false);
    // Используем useState для отслеживания данных успеваемости для импорта
    const [pendingGradesData, setPendingGradesData] = useState<GradeStudent[] | null>(null);
    // Используем useState для отслеживания выбранного периода успеваемости
    const [selectedGradesPeriod, setSelectedGradesPeriod] = useState<number | null>(null);
    // Используем useState для отслеживания изменений успеваемости
    const [isGradesModified, setIsGradesModified] = useState(false);
    // Используем useState для отслеживания сохранения успеваемости
    const [isGradesSaving, setIsGradesSaving] = useState(false);
    // Используем useState для отслеживания загрузки успеваемости
    const [isGradesLoading, setIsGradesLoading] = useState(false);
    // Используем useState для отслеживания открытия диалога удаления успеваемости
    const [showDeleteGradesDialog, setShowDeleteGradesDialog] = useState(false);
    // Используем useState для отслеживания перетаскивания успеваемости
    const [isDraggingGrades, setIsDraggingGrades] = useState(false);

    useEffect(() => {
        // Устанавливаем флаг монтирования компонента
        isMountedRef.current = true;
        // Возвращаем функцию для отслеживания размонтирования компонента
        return () => {
            // Устанавливаем флаг размонтирования компонента
            isMountedRef.current = false;
        };
    }, []);

    // Функция для обработки загрузки файла успеваемости
    const handleGradesFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            // Получаем таблицу успеваемости

            // Проверяем, что таблица существует
            const table = doc.querySelector('table.grid.gridLines.vam.marks.print_A4') || doc.querySelector('table');
            if (!table) {
                // Устанавливаем уведомление об ошибке
                setNotify({ message: "Таблица успеваемости не найдена", type: 'error' });
                // Возвращаем
                return;
            }

            // Получаем строки таблицы
            const rows = Array.from(table.querySelectorAll('tr'));
            // Получаем индекс строки заголовка
            const headerRowIndex = rows.findIndex(r => r.textContent?.includes('Фамилия') && r.textContent?.includes('Имя'));

            // Проверяем, что строка заголовка существует
            if (headerRowIndex === -1) {
                // Устанавливаем уведомление об ошибке
                setNotify({ message: "Неверный формат файла (не найдена шапка)", type: 'error' });
                // Возвращаем
                return;
            }

            // Получаем ячейки строки заголовка
            const headerCells = Array.from(rows[headerRowIndex].cells);
            // Получаем список предметов
            const subjectsList = headerCells.slice(2, -2).map(cell => (cell.textContent || '').replace(/\s+/g, ' ').trim());
            
            // Получаем данные успеваемости
            const data: GradeStudent[] = rows
                .slice(headerRowIndex + 1)
                .map(row => {
                    // Получаем ячейки строки
                    const cells = Array.from(row.cells);
                    // Получаем текст ячейки
                    const numText = cells[0]?.textContent?.trim() || '';
                    
                    // Проверяем, что текст ячейки является числом и что количество ячеек достаточно
                    if (!/^[0-9]+$/.test(numText) || cells.length < 2 + subjectsList.length) {
                        // Возвращаем null
                        return null;
                    }

                    // Получаем полное имя студента
                    const fullName = (cells[1]?.textContent || '').replace(/\s+/g, ' ').trim();
                    // Получаем список предметов
                    const subjects = subjectsList.map((name, idx) => ({
                        name,
                        grade: (cells[idx + 2]?.textContent || '').trim().replace(/\u00A0/g, ''),
                    }));

                    // Получаем список оценок
                    const validGrades = subjects
                        .map(s => parseFloat(s.grade.replace(',', '.')))
                        .filter(g => !isNaN(g) && g >= 2 && g <= 5);

                    // Получаем средний балл
                    const averageScore = validGrades.length > 0
                        ? parseFloat((validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(2))
                        : 0;

                    // Возвращаем данные успеваемости
                    return { fullName, subjects, averageScore };
                })
                .filter(Boolean) as GradeStudent[];

            // Проверяем, что данные успеваемости не пусты
            if (!data.length) {
                // Устанавливаем уведомление об ошибке
                setNotify({ message: "Не удалось извлечь учеников из файла", type: 'warning' });
                return;
            }

            // Устанавливаем данные успеваемости для импорта
            setPendingGradesData(data);
            // Устанавливаем режим диалога успеваемости
            setGradesDialogMode('import');
            // Устанавливаем флаг открытия диалога успеваемости
            setShowGradesPeriodDialog(true);
        };

        // Читаем файл
        reader.readAsText(file);
    };

    // Функция для обработки подтверждения периода успеваемости
    const handleGradesPeriodConfirm = async (period: number) => {
        // Закрываем диалог успеваемости
        setShowGradesPeriodDialog(false);
        // Устанавливаем выбранный период успеваемости
        setSelectedGradesPeriod(period);

        // Проверяем, что режим диалога успеваемости импорт и что данные успеваемости для импорта существуют
        if (gradesDialogMode === 'import' && pendingGradesData) {
            // Создаем новый список студентов успеваемости
            const imported = pendingGradesData.map(student => ({ ...student, periodSemester: period }));
            // Устанавливаем список студентов успеваемости
            setGradesStudents(imported);
            // Устанавливаем данные успеваемости для импорта
            setPendingGradesData(null);
            // Устанавливаем флаг изменений успеваемости
            setIsGradesModified(true);
            // Устанавливаем уведомление о успешном импорте
            setNotify({ message: `Файл готов к сохранению за ${SEMESTER_NAMES[period as keyof typeof SEMESTER_NAMES]}`, type: 'success' });
            // Возвращаем
            return;
        }

        // Устанавливаем флаг загрузки успеваемости
        setIsGradesLoading(true);

        try {
            // Получаем данные успеваемости из БД
            const result = await GetGrades(groupId, period);
            // Проверяем, что компонент монтирован
            if (!isMountedRef.current) return;
            
            // Проверяем, что данные успеваемости успешно загружены
            if (result.success && result.data && result.data.length > 0) {
                // Устанавливаем список студентов успеваемости
                setGradesStudents(result.data);
                // Устанавливаем флаг изменений успеваемости
                setIsGradesModified(false);
                // Устанавливаем уведомление о успешной загрузке
                setNotify({ message: `Загружены данные за ${SEMESTER_NAMES[period as keyof typeof SEMESTER_NAMES]}`, type: "success" });
                // Возвращаем
            } else if (!result.success) {
                // Проверяем, что ошибка вызвана отсутствием интернета
                const dbOffline = isDbOfflineMeta(result.status, result.code);
                // Устанавливаем список студентов успеваемости
                setGradesStudents([]);
                // Устанавливаем флаг изменений успеваемости
                setIsGradesModified(false);
                // Устанавливаем уведомление о ошибке загрузки
                setNotify({
                    message: dbOffline ? getDbOfflineToastMessage() : (result.message || "Ошибка загрузки успеваемости"),
                    type: dbOffline ? "warning" : "error",
                });
            } else {
                // Устанавливаем список студентов успеваемости
                setGradesStudents([]);
                // Устанавливаем флаг изменений успеваемости
                setIsGradesModified(false);
                // Устанавливаем уведомление о отсутствии данных
                setNotify({ message: `Нет данных за ${SEMESTER_NAMES[period as keyof typeof SEMESTER_NAMES]}`, type: "warning" });
            }
        } catch (error) {
            // Проверяем, что компонент монтирован
            if (!isMountedRef.current) return;
            // Устанавливаем уведомление о ошибке загрузки
            setNotify({ message: error instanceof Error ? error.message : "Ошибка загрузки успеваемости", type: "error" });
        } finally {
            // Проверяем, что компонент монтирован
            if (isMountedRef.current) {
                // Устанавливаем флаг загрузки успеваемости
                setIsGradesLoading(false);
            }
        }
    };

    // Функция для обработки загрузки данных успеваемости из БД
    const handleLoadGradesFromDB = () => {
        // Устанавливаем режим диалога успеваемости
        setGradesDialogMode('load');
        // Устанавливаем флаг открытия диалога успеваемости
        setShowGradesPeriodDialog(true);
    };

    // Функция для обработки открытия диалога удаления успеваемости
    const openGradesDeleteDialog = () => {
        // Проверяем, что пользователь имеет доступ к группе и что выбран период успеваемости
        if (!isOwner || selectedGradesPeriod === null) return;
        // Устанавливаем флаг открытия диалога удаления успеваемости
        setShowDeleteGradesDialog(true);
    };

    // Функция для обработки сохранения успеваемости
    const handleSaveGrades = async () => {
        // Проверяем, что пользователь имеет доступ к группе и что выбран период успеваемости и что список студентов успеваемости не пуст
        if (!isOwner || selectedGradesPeriod === null || !gradesStudents.length) return;

        // Устанавливаем флаг сохранения успеваемости
        setIsGradesSaving(true);
        // Создаем новый список студентов успеваемости
        const studentsToSave = gradesStudents.map(student => ({
            ...student,
            periodSemester: selectedGradesPeriod,
        })) as GradeStudent[];

        // Сохраняем данные успеваемости в БД
        const result = await SaveGrades(groupId, studentsToSave);
        // Проверяем, что компонент монтирован
        if (!isMountedRef.current) return;
        // Устанавливаем флаг сохранения успеваемости
        setIsGradesSaving(false);

        if (result.success) {
            // Устанавливаем флаг изменений успеваемости
            setIsGradesModified(false);
            // Создаем студентов в базе, если их там нет
            const studentNames = gradesStudents.map(s => ({ fullName: s.fullName }));
            // Создаем студентов в базе
            await CreateStudents(groupId, studentNames);
            // Устанавливаем уведомление о успешном сохранении
            setNotify({ message: "Успеваемость сохранена в БД", type: 'success' });
        } else {
            // Проверяем, что ошибка вызвана отсутствием интернета
            const dbOffline = isDbOfflineMeta(result.status, result.code);
            // Устанавливаем уведомление о ошибке сохранения
            setNotify({
                message: dbOffline ? getDbOfflineToastMessage() : (result.message || "Ошибка записи в БД"),
                type: dbOffline ? "warning" : "error"
            });
        }
    };
    // Функция для обработки удаления периода успеваемости
    const handleDeleteGradesPeriod = async () => {
        // Проверяем, что пользователь имеет доступ к группе и что выбран период успеваемости
        if (!isOwner || selectedGradesPeriod === null) return;
        // Закрываем диалог удаления успеваемости
        setShowDeleteGradesDialog(false);
        // Устанавливаем флаг загрузки успеваемости
        setIsGradesLoading(true);
        // Удаляем данные успеваемости из БД
        const result = await DeleteGradesPeriod(groupId, selectedGradesPeriod);
        // Проверяем, что компонент монтирован
        if (!isMountedRef.current) return;
        // Устанавливаем флаг загрузки успеваемости
        setIsGradesLoading(false);

        // Проверяем, что данные успеваемости успешно удалены
        if (result.success) {
            // Устанавливаем список студентов успеваемости
            setGradesStudents([]);
            // Устанавливаем выбранный период успеваемости
            setSelectedGradesPeriod(null);
            // Устанавливаем флаг изменений успеваемости
            setIsGradesModified(false);
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

    // Функция для обработки очистки успеваемости   
    const handleClearGrades = () => {
        // Устанавливаем список студентов успеваемости
        setGradesStudents([]);
        // Устанавливаем выбранный период успеваемости
        setSelectedGradesPeriod(null);
        // Устанавливаем данные успеваемости для импорта
        setPendingGradesData(null);
        // Устанавливаем флаг изменений успеваемости
        setIsGradesModified(false);
    };

    // Функция для обработки обновления поля успеваемости
    const updateGradeField = (studentIndex: number, subjectIndex: number, value: string) => {
        if (!isOwner) return;
        if (value !== "" && !/^[1-5]$/.test(value)) {
            return;
        }

        // Создаем новый список студентов успеваемости
        const updated = [...gradesStudents];
        updated[studentIndex].subjects[subjectIndex].grade = value;

        // Получаем список оценок
        const validGrades = updated[studentIndex].subjects
            .map(s => {
                const val = s.grade.trim();
                const num = parseFloat(val.replace(',', '.'));
                return isNaN(num) || val === '' ? 0 : num;
            })
            .filter(g => g > 0);

        // Получаем средний балл
        updated[studentIndex].averageScore = validGrades.length > 0
            ? parseFloat((validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(2))
            : 0;

        // Устанавливаем список студентов успеваемости
        setGradesStudents(updated);
        // Устанавливаем флаг изменений успеваемости
        setIsGradesModified(true);
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
        setIsDraggingGrades(true);
    };

    // Функция для обработки выхода из зоны перетаскивания
    const handleDragLeave = (e: React.DragEvent) => {
        // Предотвращаем стандартное поведение выхода из зоны перетаскивания
        e.preventDefault();
        // Предотвращаем распространение выхода из зоны перетаскивания
        e.stopPropagation();
        // Устанавливаем флаг перетаскивания
        setIsDraggingGrades(false);
    };

    // Функция для обработки перетаскивания файла
    const handleDrop = (e: React.DragEvent) => {
        // Предотвращаем стандартное поведение перетаскивания
        e.preventDefault();
        // Предотвращаем распространение перетаскивания
        e.stopPropagation();
        // Устанавливаем флаг перетаскивания
        setIsDraggingGrades(false);
        // Проверяем, что пользователь имеет доступ к группе
        if (!isOwner) return;

        // Получаем файлы из перетаскивания
        const files = e.dataTransfer.files;
        // Проверяем, что файлы существуют и что их количество больше 0
        if (files && files.length > 0) {
            // Создаем mock-событие для обработки файла
            const mockEvent = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>;
            // Обрабатываем файл успеваемости
            handleGradesFileUpload(mockEvent);
        }
    };

    // Функция для получения информации о стипендии 
    const getScholarshipInfo = (subjects: { grade: string }[]) => {
        // Получаем список оценок
        const grades = subjects.map(s => {
            const val = s.grade.trim();
            return val === '' ? 2 : parseInt(val);
        }).filter(g => !isNaN(g));

        // Проверяем, что есть оценки ниже 3
        if (grades.some(g => g <= 3)) return { label: "Нет", color: "bg-transparent", multiplier: 0 };

        // Получаем количество оценок 5
        const count5 = grades.filter(g => g === 5).length;
        // Получаем количество оценок 4
        const count4 = grades.filter(g => g === 4).length;

        // Проверяем, что количество оценок 5 больше 0 и что количество оценок 4 равно 0    
        if (count4 === 0 && count5 > 0) return { label: "100%", color: "bg-blue-100 dark:bg-blue-900/30", multiplier: 2 };
        // Проверяем, что количество оценок 5 больше количества оценок 4
        if (count5 > count4) return { label: "50%", color: "bg-green-100 dark:bg-green-900/30", multiplier: 1.5 };
        // Проверяем, что количество оценок 4 больше 0
        if (count4 > 0) return { label: "Обычная", color: "bg-yellow-100 dark:bg-yellow-900/30", multiplier: 1 };

        // Возвращаем информацию о стипендии
        return { label: "—", color: "bg-transparent", multiplier: 0 };
    };

    // Функция для получения цвета оценки   
    const getGradeColor = (grade: string) => {
        // Получаем значение оценки
        const val = grade.trim();
        // Проверяем, что значение оценки не пустое
        if (val === '') return "bg-red-500/20 dark:bg-red-900/40";

        // Получаем значение оценки
        const g = parseInt(val);
        // Проверяем, что значение оценки равно 5
        if (g === 5) return "bg-green-600/30 text-green-700 dark:text-green-300";
        // Проверяем, что значение оценки равно 4
        if (g === 4) return "bg-emerald-400/20 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300";
        // Проверяем, что значение оценки равно 3
        if (g === 3) return "bg-amber-400/20 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400";
        // Проверяем, что значение оценки меньше или равно 2 и больше 0
        if (g <= 2 && g > 0) return "bg-red-500/20 dark:bg-red-600/30 text-red-700 dark:text-red-400";
        return "";
    };

    return (
        <div className="w-full bg-card rounded-lg border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
            <div className="bg-linear-to-r from-purple-50 to-pink-50 dark:from-zinc-800 dark:to-zinc-800/50 border-b border-gray-100 dark:border-zinc-700 px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-600 text-white rounded-lg"><GraduationCap size={20} /></div>
                        <div>
                            <h2 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">Журнал успеваемости</h2>
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
                    {gradesStudents.length > 0 && (
                        <button onClick={() => exportGradesToWord(gradesStudents, group)} className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-purple-50 dark:bg-zinc-800 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium border border-gray-200 dark:border-zinc-700 hover:border-purple-300 transition-all">
                            <Download size={16} /> Экспорт
                        </button>
                    )}
                    {gradesStudents.length === 0 && (
                        <button
                            onClick={handleLoadGradesFromDB}
                            disabled={isGradesLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50"
                        >
                            {isGradesLoading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />} Загрузить из БД
                        </button>
                    )}
                    {gradesStudents.length > 0 && (
                        <>
                            <button
                                onClick={handleSaveGrades}
                                disabled={isGradesSaving || selectedGradesPeriod === null || gradesStudents.length === 0}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-medium rounded-lg text-sm transition-all disabled:opacity-50"
                            >
                                {isGradesSaving ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />} Сохранить в БД
                            </button>
                            <button
                                onClick={openGradesDeleteDialog}
                                disabled={selectedGradesPeriod === null}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-600 dark:bg-red-900/20 dark:hover:bg-red-900 text-red-600 hover:text-white dark:text-red-400 rounded-lg text-sm transition-colors disabled:opacity-50"
                            >
                                <Trash2 size={16} /> Удалить период
                            </button>
                            <button
                                onClick={handleClearGrades}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium border border-gray-200 dark:border-zinc-700 transition-all"
                            >
                                <Trash2 size={16} /> Очистить
                            </button>
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
                        className={`shadow-sm flex flex-col items-center justify-center py-20 border-2 border-dashed cursor-pointer transition-all group ${isDraggingGrades ? "border-purple-500 bg-purple-50/50" : "border-gray-100 dark:border-zinc-700 dark:hover:bg-neutral-800 hover:bg-neutral-50"}`}
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
                                <th className="py-4 px-2 min-w-[150 px] bg-purple-50/50 dark:bg-purple-900/20 text-purple-500">Надбавка стипендии</th>
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
                                        <td className="py-3 text-center font-bold">{student.averageScore}</td>
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

            <Dialog open={showDeleteGradesDialog} onOpenChange={setShowDeleteGradesDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить период успеваемости</DialogTitle>
                        <DialogDescription>
                            Вы уверены, что хотите удалить записи успеваемости за {selectedGradesPeriod !== null ? SEMESTER_NAMES[selectedGradesPeriod as keyof typeof SEMESTER_NAMES] : 'выбранный период'} из базы данных? Это действие нельзя отменить.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3">
                        <button
                            onClick={handleDeleteGradesPeriod}
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
                open={showGradesPeriodDialog}
                onClose={() => {
                    setShowGradesPeriodDialog(false);
                    setPendingGradesData(null);
                }}
                onConfirm={handleGradesPeriodConfirm}
                type="grades"
                defaultValue={selectedGradesPeriod || undefined}
            />
        </div>
    );
}

"use client"
import React, { useState } from "react";
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

interface GroupGradesProps {
    groupId: string;
    group: Group;
    isOwner: boolean;
    setNotify: React.Dispatch<React.SetStateAction<Notify>>;
}

export default function GroupGrades({ groupId, group, isOwner, setNotify }: GroupGradesProps) {
    const [gradesStudents, setGradesStudents] = useState<GradeStudent[]>([]);
    const [gradesDialogMode, setGradesDialogMode] = useState<'load' | 'import'>('load');
    const [showGradesPeriodDialog, setShowGradesPeriodDialog] = useState(false);
    const [pendingGradesData, setPendingGradesData] = useState<GradeStudent[] | null>(null);
    const [selectedGradesPeriod, setSelectedGradesPeriod] = useState<number | null>(null);
    const [isGradesModified, setIsGradesModified] = useState(false);
    const [isGradesSaving, setIsGradesSaving] = useState(false);
    const [isGradesLoading, setIsGradesLoading] = useState(false);
    const [showDeleteGradesDialog, setShowDeleteGradesDialog] = useState(false);
    const [isDraggingGrades, setIsDraggingGrades] = useState(false);

    const handleGradesFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isOwner) return;
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(event.target?.result as string, 'text/html');

            const table = doc.querySelector('table.grid.gridLines.vam.marks.print_A4') || doc.querySelector('table');
            if (!table) {
                setNotify({ message: "Таблица успеваемости не найдена", type: 'error' });
                return;
            }

            const rows = Array.from(table.querySelectorAll('tr'));
            const headerRowIndex = rows.findIndex(r => r.textContent?.includes('Фамилия') && r.textContent?.includes('Имя'));

            if (headerRowIndex === -1) {
                setNotify({ message: "Неверный формат файла (не найдена шапка)", type: 'error' });
                return;
            }

            const headerCells = Array.from(rows[headerRowIndex].cells);
            const subjectsList = headerCells.slice(2, -2).map(cell => (cell.textContent || '').replace(/\s+/g, ' ').trim());

            const data: GradeStudent[] = rows
                .slice(headerRowIndex + 1)
                .map(row => {
                    const cells = Array.from(row.cells);
                    const numText = cells[0]?.textContent?.trim() || '';

                    if (!/^[0-9]+$/.test(numText) || cells.length < 2 + subjectsList.length) {
                        return null;
                    }

                    const fullName = (cells[1]?.textContent || '').replace(/\s+/g, ' ').trim();
                    const subjects = subjectsList.map((name, idx) => ({
                        name,
                        grade: (cells[idx + 2]?.textContent || '').trim().replace(/\u00A0/g, ''),
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

            if (!data.length) {
                setNotify({ message: "Не удалось извлечь учеников из файла", type: 'warning' });
                return;
            }

            setPendingGradesData(data);
            setGradesDialogMode('import');
            setShowGradesPeriodDialog(true);
        };

        reader.readAsText(file);
    };

    const handleGradesPeriodConfirm = async (period: number) => {
        setShowGradesPeriodDialog(false);
        setSelectedGradesPeriod(period);

        if (gradesDialogMode === 'import' && pendingGradesData) {
            const imported = pendingGradesData.map(student => ({ ...student, periodSemester: period }));
            setGradesStudents(imported);
            setPendingGradesData(null);
            setIsGradesModified(true);
            setNotify({ message: `Файл готов к сохранению за ${SEMESTER_NAMES[period as keyof typeof SEMESTER_NAMES]}`, type: 'success' });
            return;
        }

        setIsGradesLoading(true);
        const result = await GetGrades(groupId, period);
        setIsGradesLoading(false);

        if (result.success && result.data.length > 0) {
            setGradesStudents(result.data);
            setIsGradesModified(false);
            setNotify({ message: `Загружены данные за ${SEMESTER_NAMES[period as keyof typeof SEMESTER_NAMES]}`, type: 'success' });
        } else {
            setGradesStudents([]);
            setIsGradesModified(false);
            setNotify({ message: `Нет данных за ${SEMESTER_NAMES[period as keyof typeof SEMESTER_NAMES]}`, type: 'warning' });
        }
    };

    const handleLoadGradesFromDB = () => {
        setGradesDialogMode('load');
        setShowGradesPeriodDialog(true);
    };

    const openGradesDeleteDialog = () => {
        if (!isOwner || selectedGradesPeriod === null) return;
        setShowDeleteGradesDialog(true);
    };

    const handleSaveGrades = async () => {
        if (!isOwner || selectedGradesPeriod === null || !gradesStudents.length) return;

        setIsGradesSaving(true);
        const studentsToSave = gradesStudents.map(student => ({
            ...student,
            periodSemester: selectedGradesPeriod,
        })) as GradeStudent[];

        const result = await SaveGrades(groupId, studentsToSave);
        setIsGradesSaving(false);

        if (result.success) {
            setIsGradesModified(false);
            // Создаем студентов в базе, если их там нет
            const studentNames = gradesStudents.map(s => ({ fullName: s.fullName }));
            await CreateStudents(groupId, studentNames);
            setNotify({ message: "Успеваемость сохранена в БД", type: 'success' });
        } else {
            setNotify({ message: result.message || "Ошибка записи в БД", type: 'error' });
        }
    };

    const handleDeleteGradesPeriod = async () => {
        if (!isOwner || selectedGradesPeriod === null) return;

        setShowDeleteGradesDialog(false);
        setIsGradesLoading(true);
        const result = await DeleteGradesPeriod(groupId, selectedGradesPeriod);
        setIsGradesLoading(false);

        if (result.success) {
            setGradesStudents([]);
            setSelectedGradesPeriod(null);
            setIsGradesModified(false);
            setNotify({ message: "Записи за период удалены из БД", type: 'success' });
        } else {
            setNotify({ message: result.message || "Не удалось удалить период", type: 'error' });
        }
    };

    const handleClearGrades = () => {
        setGradesStudents([]);
        setSelectedGradesPeriod(null);
        setPendingGradesData(null);
        setIsGradesModified(false);
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
        if (!isOwner) return;
        setIsDraggingGrades(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingGrades(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingGrades(false);

        if (!isOwner) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const mockEvent = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleGradesFileUpload(mockEvent);
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

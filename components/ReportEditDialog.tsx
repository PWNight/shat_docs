"use client";
import React, { useState, useRef, useEffect } from "react";
import { X, Save, Download, Edit3, Eye, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Group, Notify } from "@/utils/interfaces";

interface ReportEditDialogProps {
    open: boolean;
    onClose: () => void;
    reportType: 'attendance' | 'grades';
    reportData: any;
    group: Group;
    setNotify: (notify: Notify) => void;
}

interface EditableField {
    id: string;
    label: string;
    value: string;
    type: 'text' | 'textarea' | 'number';
    row?: number;
    col?: number;
}

export default function ReportEditDialog({ 
    open, 
    onClose, 
    reportType, 
    reportData, 
    group, 
    setNotify 
}: ReportEditDialogProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [editableFields, setEditableFields] = useState<EditableField[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize editable fields based on report type
    useEffect(() => {
        if (!open) return;

        if (reportType === 'grades') {
            const fields: EditableField[] = [
                { id: 'title', label: 'Заголовок отчёта', value: 'Отчёт', type: 'text' },
                { id: 'subtitle', label: 'Подзаголовок', value: `по итогам работы группы за ${reportData?.semesterText || ''}`, type: 'text' },
                { id: 'groupNumber', label: 'Номер группы', value: group.name, type: 'text' },
                { id: 'studentCount', label: 'Количество студентов', value: String(reportData?.totalStudents || 0), type: 'number' },
                { id: 'groupLeader', label: 'Староста группы', value: reportData?.groupLeader || '', type: 'text' },
                { id: 'classTeacher', label: 'Классный воспитатель', value: group.leader || '', type: 'text' },
                { id: 'performance1', label: 'Успеваемость в группе (без "2")', value: String(reportData?.performance1 || 0), type: 'number' },
                { id: 'quality1', label: 'Качество знаний ("4" и "5")', value: String(reportData?.quality1 || 0), type: 'number' },
                { id: 'excellent', label: 'Количество отличников', value: String(reportData?.excellentStudents || 0), type: 'number' },
                { id: 'unrespectful', label: 'Пропуски без уважительной причины', value: reportData?.unrespectful || '-', type: 'textarea' },
                { id: 'events', label: 'Участие в мероприятиях', value: reportData?.events || '-', type: 'textarea' },
                { id: 'achievements', label: 'Победы студентов', value: reportData?.achievements || '-', type: 'textarea' },
                { id: 'groupWins', label: 'Победы группы', value: reportData?.groupWins || '-', type: 'textarea' },
                { id: 'clubs', label: 'Посещение кружков и секций', value: reportData?.clubs || '-', type: 'textarea' },
                { id: 'classHours', label: 'Классные часы', value: reportData?.classHours || '-', type: 'textarea' },
                { id: 'violations', label: 'Правонарушения', value: reportData?.violations || '-', type: 'textarea' },
            ];
            setEditableFields(fields);
        } else if (reportType === 'attendance') {
            const fields: EditableField[] = [
                { id: 'title', label: 'Заголовок отчёта', value: `Отчёт по посещаемости ${group.name} группа за ${reportData?.monthText || ''} ${new Date().getFullYear()} года.`, type: 'text' },
                { id: 'classTeacher', label: 'Классный руководитель', value: group.leader || '', type: 'text' },
                { id: 'totalStudents', label: 'Всего студентов в группе', value: String(reportData?.totalStudents || 0), type: 'number' },
                { id: 'sickStudents', label: 'Пропущено по болезни', value: reportData?.sickStudents || '-', type: 'textarea' },
                { id: 'respectfulAbsences', label: 'Пропущено по уважительной причине', value: reportData?.respectfulAbsences || '-', type: 'textarea' },
                { id: 'unrespectfulAbsences', label: 'Пропущено без уважительной причины', value: reportData?.unrespectfulAbsences || '-', type: 'textarea' },
                { id: 'preventiveWork', label: 'Профилактическая работа', value: reportData?.preventiveWork || '-', type: 'textarea' },
            ];
            setEditableFields(fields);
        }
    }, [open, reportData, reportType, group]);

    const updateField = (fieldId: string, value: string) => {
        setEditableFields(prev => 
            prev.map(field => 
                field.id === fieldId ? { ...field, value } : field
            )
        );
    };

    const handleSaveAndDownload = async () => {
        setIsGenerating(true);
        try {
            // Create updated report data from editable fields
            const updatedData = editableFields.reduce((acc, field) => {
                acc[field.id] = field.value;
                return acc;
            }, {} as any);

            console.log('Downloading report with data:', updatedData);
            console.log('Report type:', reportType);

            if (reportType === 'grades') {
                await downloadUpdatedGradesReport(updatedData);
            } else {
                await downloadUpdatedAttendanceReport(updatedData);
            }
            
            setNotify({ message: 'Отчёт успешно сформирован и скачан', type: 'success' });
            onClose();
        } catch (error) {
            console.error('Error downloading report:', error);
            setNotify({ 
                message: error instanceof Error ? error.message : 'Ошибка при формировании отчёта', 
                type: 'error' 
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadUpdatedGradesReport = async (data: any) => {
        // Import the docx library dynamically
        const { exportGradesToWord } = await import('@/utils/functions');
        
        // Create custom report data with the edited values
        const customData = {
            semesterText: data.subtitle?.replace('по итогам работы группы за ', '') || '',
            totalStudents: parseInt(data.studentCount) || 0,
            excellentStudents: parseInt(data.excellent) || 0,
            groupLeader: data.groupLeader || '',
            performance1: parseInt(data.performance1) || 0,
            quality1: parseInt(data.quality1) || 0,
            unrespectful: data.unrespectful || '',
            events: data.events || '',
            achievements: data.achievements || '',
            groupWins: data.groupWins || '',
            clubs: data.clubs || '',
            classHours: data.classHours || '',
            violations: data.violations || '',
            classTeacher: data.classTeacher || group.leader || '',
        };

        // Create minimal student data for the export function
        const mockStudent = {
            fullName: data.groupLeader || 'Студент',
            subjects: [],
            averageScore: 0,
            periodSemester: 1
        };

        await exportGradesToWord([mockStudent], group, customData);
    };

    const downloadUpdatedAttendanceReport = async (data: any) => {
        // Import the docx library dynamically
        const { exportToWord } = await import('@/utils/functions');
        
        // Create custom report data with the edited values
        const customData = {
            monthText: data.title?.match(/за (\w+) /)?.[1] || '',
            currentYear: new Date().getFullYear(),
            totalStudents: parseInt(data.totalStudents) || 0,
            sickStudents: data.sickStudents || '',
            respectfulAbsences: data.respectfulAbsences || '',
            unrespectfulAbsences: data.unrespectfulAbsences || '',
            preventiveWork: data.preventiveWork || '',
            classTeacher: data.classTeacher || group.leader || '',
        };

        // Create minimal attendance data for the export function
        const mockStudent = {
            number: '1',
            fullName: 'Студент',
            fullDaysTotal: 0,
            fullDaysSick: 0,
            lessonsTotal: 0,
            lessonsSick: 0,
            late: 0,
            periodMonth: new Date().getMonth() + 1,
        };

        const mockTotal = {
            fullDaysTotal: 0,
            fullDaysSick: 0,
            lessonsTotal: 0,
            lessonsSick: 0,
            late: 0,
        };

        await exportToWord([mockStudent], mockTotal, group, customData);
    };

    const renderField = (field: EditableField) => {
        const commonClasses = "w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-background text-sm";
        
        if (field.type === 'textarea') {
            return (
                <textarea
                    value={field.value}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    className={`${commonClasses} min-h-[80px] resize-vertical`}
                    style={{ whiteSpace: 'pre-wrap' }}
                    placeholder={field.label}
                />
            );
        }
        
        return (
            <input
                type={field.type}
                value={field.value}
                onChange={(e) => updateField(field.id, e.target.value)}
                className={commonClasses}
                placeholder={field.label}
            />
        );
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="ml-4 border-b border-gray-200 dark:border-zinc-700 pb-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-semibold">
                            Редактирование отчёта
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSaveAndDownload}
                                disabled={isGenerating}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                Скачать отчёт
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-6">
                        {/* Report Header Preview */}
                        <div className="space-y-2 border-b border-gray-200 dark:border-zinc-700 pb-6">
                            <div className="text-2xl font-bol">
                                {editableFields.find(f => f.id === 'title')?.value || ''}
                            </div>
                            <div className="text-xl">
                                {editableFields.find(f => f.id === 'subtitle')?.value || ''}
                            </div>
                            {reportType === 'attendance' && (
                                <div className="text-lg">
                                    {editableFields.find(f => f.id === 'classTeacher')?.value || ''}
                                </div>
                            )}
                        </div>

                        {/* Editable Fields */}
                        <div className="grid gap-4">
                            {reportType === 'grades' ? (
                                <>
                                    {/* Group Information Table */}
                                    <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-zinc-800">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Группа №</th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Количество человек</th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Староста группы</th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Классный воспитатель</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="px-4 py-2">
                                                        {renderField(editableFields.find(f => f.id === 'groupNumber') || { id: 'groupNumber', label: '', value: '', type: 'text' })}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {renderField(editableFields.find(f => f.id === 'studentCount') || { id: 'studentCount', label: '', value: '', type: 'number' })}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {renderField(editableFields.find(f => f.id === 'groupLeader') || { id: 'groupLeader', label: '', value: '', type: 'text' })}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {renderField(editableFields.find(f => f.id === 'classTeacher') || { id: 'classTeacher', label: '', value: '', type: 'text' })}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Performance Criteria */}
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Конкурсные критерии оценки</h3>
                                        {[
                                            'performance1', 'quality1', 'excellent', 'unrespectful', 
                                            'events', 'achievements', 'groupWins', 'clubs', 
                                            'classHours', 'violations'
                                        ].map((fieldId, index) => {
                                            const field = editableFields.find(f => f.id === fieldId);
                                            if (!field) return null;
                                            
                                            const labels = {
                                                performance1: '1. Успеваемость в группе (количество человек в группе без «2» и неаттестованных по предметам)',
                                                quality1: '2. Качество знаний: обучаются на «4» и «5»',
                                                excellent: '3. Количество отличников в группе',
                                                unrespectful: '4. Количество человек в группе пропускающих занятия без уважительной причины',
                                                events: '5. Участие группы в мероприятиях',
                                                achievements: '6. Победа студента группы в любом виде деятельности',
                                                groupWins: '7. Победа группы в спортивных мероприятиях',
                                                clubs: '8. Посещение кружков и секций',
                                                classHours: '9. Проведение классных часов',
                                                violations: '10. Правонарушения в группе'
                                            };
                                            
                                            return (
                                                <div key={fieldId} className="flex items-start gap-4">
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            {labels[fieldId as keyof typeof labels]}
                                                        </label>
                                                        {renderField(field)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Attendance Report Fields */}
                                    <div className="space-y-4">
                                        {editableFields.map(field => (
                                            <div key={field.id} className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {field.label}
                                                </label>
                                                {renderField(field)}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

"use client";
import { useState, useEffect, useId } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import {
    AttendanceReportData,
    AttendanceReportFieldId,
    AttendanceStudent,
    AttendanceTotal,
    GradesReportData,
    GradesReportFieldId,
    GradeStudent,
    Group,
    Notify,
    ReportFieldId,
} from "@/utils/interfaces";

type ReportEditDialogProps =
    | {
          open: boolean;
          onClose: () => void;
          reportType: "grades";
          reportData: GradesReportData;
          group: Group;
          setNotify: (notify: Notify) => void;
      }
    | {
          open: boolean;
          onClose: () => void;
          reportType: "attendance";
          reportData: AttendanceReportData;
          group: Group;
          setNotify: (notify: Notify) => void;
      };

interface EditableField {
    id: ReportFieldId;
    label: string;
    value: string;
    type: "text" | "textarea" | "number";
}

const GRADES_CRITERIA_LABELS: Record<
    Extract<
        GradesReportFieldId,
        | "performance1"
        | "quality1"
        | "excellent"
        | "unrespectful"
        | "events"
        | "achievements"
        | "groupWins"
        | "clubs"
        | "classHours"
        | "violations"
    >,
    string
> = {
    performance1: "1. Успеваемость в группе (количество человек в группе без «2» и неаттестованных по предметам)",
    quality1: '2. Качество знаний: обучаются на «4» и «5»',
    excellent: "3. Количество отличников в группе",
    unrespectful: "4. Количество человек в группе пропускающих занятия без уважительной причины",
    events: "5. Участие группы в мероприятиях",
    achievements: "6. Победа студента группы в любом виде деятельности",
    groupWins: "7. Победа группы в спортивных мероприятиях",
    clubs: "8. Посещение кружков и секций",
    classHours: "9. Проведение классных часов",
    violations: "10. Правонарушения в группе",
};

const GRADES_CRITERIA_FIELDS = [
    "performance1",
    "quality1",
    "excellent",
    "unrespectful",
    "events",
    "achievements",
    "groupWins",
    "clubs",
    "classHours",
    "violations",
] as const satisfies readonly GradesReportFieldId[];

function fieldsToRecord(fields: EditableField[]): Record<string, string> {
    return fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.id] = field.value;
        return acc;
    }, {});
}

export default function ReportEditDialog(props: ReportEditDialogProps) {
    const { open, onClose, reportType, reportData, group, setNotify } = props;
    const titleId = useId();
    const [isGenerating, setIsGenerating] = useState(false);
    const [editableFields, setEditableFields] = useState<EditableField[]>([]);

    useEffect(() => {
        if (!open) return;

        if (reportType === "grades") {
            const data = reportData as GradesReportData;
            const fields: EditableField[] = [
                { id: "title", label: "Заголовок отчёта", value: "Отчёт", type: "text" },
                {
                    id: "subtitle",
                    label: "Подзаголовок",
                    value: `по итогам работы группы за ${data.semesterText || ""}`,
                    type: "text",
                },
                { id: "groupNumber", label: "Номер группы", value: group.name, type: "text" },
                {
                    id: "studentCount",
                    label: "Количество студентов",
                    value: String(data.totalStudents || 0),
                    type: "number",
                },
                { id: "groupLeader", label: "Староста группы", value: data.groupLeader || "", type: "text" },
                {
                    id: "classTeacher",
                    label: "Классный воспитатель",
                    value: group.leader || "",
                    type: "text",
                },
                {
                    id: "performance1",
                    label: 'Успеваемость в группе (без "2")',
                    value: String(data.performance1 || 0),
                    type: "number",
                },
                {
                    id: "quality1",
                    label: 'Качество знаний ("4" и "5")',
                    value: String(data.quality1 || 0),
                    type: "number",
                },
                {
                    id: "excellent",
                    label: "Количество отличников",
                    value: String(data.excellentStudents || 0),
                    type: "number",
                },
                { id: "unrespectful", label: "Пропуски без уважительной причины", value: data.unrespectful || "-", type: "textarea" },
                { id: "events", label: "Участие в мероприятиях", value: data.events || "-", type: "textarea" },
                { id: "achievements", label: "Победы студентов", value: data.achievements || "-", type: "textarea" },
                { id: "groupWins", label: "Победы группы", value: data.groupWins || "-", type: "textarea" },
                { id: "clubs", label: "Посещение кружков и секций", value: data.clubs || "-", type: "textarea" },
                { id: "classHours", label: "Классные часы", value: data.classHours || "-", type: "textarea" },
                { id: "violations", label: "Правонарушения", value: data.violations || "-", type: "textarea" },
            ];
            setEditableFields(fields);
            return;
        }

        const data = reportData as AttendanceReportData;
        const fields: EditableField[] = [
            {
                id: "title",
                label: "Заголовок отчёта",
                value: `Отчёт по посещаемости ${group.name} группа за ${data.monthText || ""} ${new Date().getFullYear()} года.`,
                type: "text",
            },
            { id: "classTeacher", label: "Классный руководитель", value: group.leader || "", type: "text" },
            {
                id: "totalStudents",
                label: "Всего студентов в группе",
                value: String(data.totalStudents || 0),
                type: "number",
            },
            { id: "sickStudents", label: "Пропущено по болезни", value: data.sickStudents || "-", type: "textarea" },
            {
                id: "respectfulAbsences",
                label: "Пропущено по уважительной причине",
                value: data.respectfulAbsences || "-",
                type: "textarea",
            },
            {
                id: "unrespectfulAbsences",
                label: "Пропущено без уважительной причины",
                value: data.unrespectfulAbsences || "-",
                type: "textarea",
            },
            {
                id: "preventiveWork",
                label: "Профилактическая работа",
                value: data.preventiveWork || "-",
                type: "textarea",
            },
        ];
        setEditableFields(fields);
    }, [open, reportData, reportType, group]);

    const updateField = (fieldId: ReportFieldId, value: string) => {
        setEditableFields((prev) => prev.map((field) => (field.id === fieldId ? { ...field, value } : field)));
    };

    const handleSaveAndDownload = async () => {
        setIsGenerating(true);
        try {
            const updatedData = fieldsToRecord(editableFields);

            if (reportType === "grades") {
                await downloadUpdatedGradesReport(updatedData);
            } else {
                await downloadUpdatedAttendanceReport(updatedData);
            }

            setNotify({ message: "Отчёт успешно сформирован и скачан", type: "success" });
            onClose();
        } catch (error) {
            console.error("Error downloading report:", error);
            setNotify({
                message: error instanceof Error ? error.message : "Ошибка при формировании отчёта",
                type: "error",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadUpdatedGradesReport = async (data: Record<string, string>) => {
        const { exportGradesToWord } = await import("@/utils/functions");

        const customData: Partial<GradesReportData> = {
            semesterText: data.subtitle?.replace("по итогам работы группы за ", "") || "",
            totalStudents: parseInt(data.studentCount, 10) || 0,
            excellentStudents: parseInt(data.excellent, 10) || 0,
            groupLeader: data.groupLeader || "",
            performance1: parseInt(data.performance1, 10) || 0,
            quality1: parseInt(data.quality1, 10) || 0,
            unrespectful: data.unrespectful || "",
            events: data.events || "",
            achievements: data.achievements || "",
            groupWins: data.groupWins || "",
            clubs: data.clubs || "",
            classHours: data.classHours || "",
            violations: data.violations || "",
            classTeacher: data.classTeacher || group.leader || "",
        };

        const mockStudent: GradeStudent = {
            fullName: data.groupLeader || "Студент",
            subjects: [],
            averageScore: 0,
            periodSemester: 1,
        };

        await exportGradesToWord([mockStudent], group, customData);
    };

    const downloadUpdatedAttendanceReport = async (data: Record<string, string>) => {
        const { exportToWord } = await import("@/utils/functions");

        const customData: Partial<AttendanceReportData> = {
            monthText: data.title?.match(/за (\S+) /)?.[1] || "",
            currentYear: new Date().getFullYear(),
            totalStudents: parseInt(data.totalStudents, 10) || 0,
            sickStudents: data.sickStudents || "",
            respectfulAbsences: data.respectfulAbsences || "",
            unrespectfulAbsences: data.unrespectfulAbsences || "",
            preventiveWork: data.preventiveWork || "",
            classTeacher: data.classTeacher || group.leader || "",
        };

        const mockStudent: AttendanceStudent = {
            number: "1",
            fullName: "Студент",
            fullDaysTotal: 0,
            fullDaysSick: 0,
            lessonsTotal: 0,
            lessonsSick: 0,
            late: 0,
            periodMonth: new Date().getMonth() + 1,
        };

        const mockTotal: AttendanceTotal = {
            fullDaysTotal: 0,
            fullDaysSick: 0,
            lessonsTotal: 0,
            lessonsSick: 0,
            late: 0,
        };

        await exportToWord([mockStudent], mockTotal, group, customData);
    };

    const renderField = (field: EditableField) => {
        const fieldDomId = `${titleId}-${field.id}`;
        const commonClasses =
            "w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-background text-sm";

        if (field.type === "textarea") {
            return (
                <textarea
                    id={fieldDomId}
                    value={field.value}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    className={`${commonClasses} min-h-[80px] resize-vertical`}
                    style={{ whiteSpace: "pre-wrap" }}
                    aria-label={field.label}
                />
            );
        }

        return (
            <input
                id={fieldDomId}
                type={field.type}
                value={field.value}
                onChange={(e) => updateField(field.id, e.target.value)}
                className={commonClasses}
                aria-label={field.label}
            />
        );
    };

    const getField = (id: ReportFieldId): EditableField => {
        return editableFields.find((field) => field.id === id) ?? { id, label: "", value: "", type: "text" };
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="max-w-2xl max-h-[90vh] flex flex-col"
                aria-labelledby={titleId}
                aria-describedby={`${titleId}-description`}
            >
                <DialogHeader className="ml-4 border-b border-gray-200 dark:border-zinc-700 pb-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle id={titleId} className="text-xl font-semibold">
                            Редактирование отчёта
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSaveAndDownload}
                                disabled={isGenerating}
                                aria-busy={isGenerating}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isGenerating ? (
                                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                ) : (
                                    <Download size={16} aria-hidden="true" />
                                )}
                                Скачать отчёт
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Закрыть диалог редактирования"
                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                            >
                                <X size={20} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                    <p id={`${titleId}-description`} className="sr-only">
                        Измените поля отчёта и скачайте документ Word.
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-6">
                        <div className="space-y-2 border-b border-gray-200 dark:border-zinc-700 pb-6" aria-live="polite">
                            <div className="text-2xl font-bold">{getField("title").value}</div>
                            {reportType === "grades" ? (
                                <div className="text-xl">{getField("subtitle").value}</div>
                            ) : (
                                <div className="text-lg">{getField("classTeacher").value}</div>
                            )}
                        </div>

                        <div className="grid gap-4">
                            {reportType === "grades" ? (
                                <>
                                    <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                                        <table className="w-full" aria-label="Информация о группе">
                                            <caption className="sr-only">Основные сведения о группе для отчёта</caption>
                                            <thead className="bg-gray-50 dark:bg-zinc-800">
                                                <tr>
                                                    <th scope="col" className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Группа №
                                                    </th>
                                                    <th scope="col" className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Количество человек
                                                    </th>
                                                    <th scope="col" className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Староста группы
                                                    </th>
                                                    <th scope="col" className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Классный воспитатель
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="px-4 py-2">{renderField(getField("groupNumber"))}</td>
                                                    <td className="px-4 py-2">{renderField(getField("studentCount"))}</td>
                                                    <td className="px-4 py-2">{renderField(getField("groupLeader"))}</td>
                                                    <td className="px-4 py-2">{renderField(getField("classTeacher"))}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Конкурсные критерии оценки
                                        </h3>
                                        {GRADES_CRITERIA_FIELDS.map((fieldId) => {
                                            const field = getField(fieldId);
                                            return (
                                                <div key={fieldId} className="flex items-start gap-4">
                                                    <div className="flex-1">
                                                        <label
                                                            htmlFor={`${titleId}-${fieldId}`}
                                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                                        >
                                                            {GRADES_CRITERIA_LABELS[fieldId]}
                                                        </label>
                                                        {renderField(field)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    {editableFields.map((field) => (
                                        <div key={field.id} className="space-y-2">
                                            <label
                                                htmlFor={`${titleId}-${field.id}`}
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                            >
                                                {field.label}
                                            </label>
                                            {renderField(field)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

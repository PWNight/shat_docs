import {twMerge} from "tailwind-merge";
import clsx, {ClassValue} from "clsx";
import {
    AlignmentType,
    Document,
    HeadingLevel, Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow, TextRun,
    VerticalAlign,
    WidthType
} from "docx";
import {saveAs} from "file-saver";
import {
    AttendanceStudent, AttendanceTotal, GradeStudent, Group
} from "@/utils/interfaces";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Общий тип для API ответов с ошибкой
interface ApiErrorResponse {
    message?: string;
}

// Утилита для обработки API ответов
export async function handleApiResponse(response: Response) {
    if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        console.log(errorData);

        throw new Error(errorData.message
            ? `${errorData.message} (err ${response.status})`
            : `Неизвестная ошибка (err ${response.status})`);
    }
    return response.json();
}

// Функция экпорта посещаемости в Word
export const exportToWord = async (attendanceStudents: AttendanceStudent[], attendanceTotal: AttendanceTotal, group: Group) => {
    if (attendanceStudents.length === 0) return;
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    text: `Отчет по посещаемости группы: ${group?.name || ""}`,
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("ID")], rowSpan: 2, verticalAlign: VerticalAlign.CENTER }),
                                new TableCell({ children: [new Paragraph("ФИО")], rowSpan: 2, verticalAlign: VerticalAlign.CENTER }),
                                new TableCell({ children: [new Paragraph({ text: "Дни", alignment: AlignmentType.CENTER })], columnSpan: 2 }),
                                new TableCell({ children: [new Paragraph({ text: "Уроки", alignment: AlignmentType.CENTER })], columnSpan: 2 }),
                                new TableCell({ children: [new Paragraph("Опозд.")], rowSpan: 2, verticalAlign: VerticalAlign.CENTER }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Всего")] }),
                                new TableCell({ children: [new Paragraph("Болезнь")] }),
                                new TableCell({ children: [new Paragraph("Всего")] }),
                                new TableCell({ children: [new Paragraph("Болезнь")] }),
                            ],
                        }),
                        ...attendanceStudents.map(s => new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph(s.number)] }),
                                new TableCell({ children: [new Paragraph(s.fullName)] }),
                                new TableCell({ children: [new Paragraph(s.fullDaysTotal.toString())] }),
                                new TableCell({ children: [new Paragraph(s.fullDaysSick.toString())] }),
                                new TableCell({ children: [new Paragraph(s.lessonsTotal.toString())] }),
                                new TableCell({ children: [new Paragraph(s.lessonsSick.toString())] }),
                                new TableCell({ children: [new Paragraph(s.late.toString())] }),
                            ],
                        })),
                        ...(attendanceTotal ? [new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ИТОГО", bold: true })] })], columnSpan: 2 }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: attendanceTotal.fullDaysTotal.toString(), bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: attendanceTotal.fullDaysSick.toString(), bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: attendanceTotal.lessonsTotal.toString(), bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: attendanceTotal.lessonsSick.toString(), bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: attendanceTotal.late.toString(), bold: true })] })] }),
                            ],
                        })] : [])
                    ],
                }),
            ],
        }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Отчет_Посещаемость_${group?.name}.docx`);
};

// Функция экспорта успеваемости в word
export const exportGradesToWord = async (gradesStudents: GradeStudent[], group: Group) => {
    if (gradesStudents.length === 0) return;
    const subjects = gradesStudents[0].subjects;

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    text: `Отчет по успеваемости группы: ${group?.name || ""}`,
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("ФИО")] }),
                                ...subjects.map(s => new TableCell({ children: [new Paragraph({ text: s.name, alignment: AlignmentType.CENTER })] })),
                                new TableCell({ children: [new Paragraph("Ср. балл")] }),
                            ],
                        }),
                        ...gradesStudents.map(s => new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph(s.fullName)] }),
                                ...s.subjects.map(sub => new TableCell({ children: [new Paragraph({ text: sub.grade, alignment: AlignmentType.CENTER })] })),
                                new TableCell({ children: [new Paragraph({ text: s.averageScore.toString(), alignment: AlignmentType.CENTER })] }),
                            ],
                        }))
                    ],
                }),
            ],
        }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Успеваемость_${group?.name}.docx`);
};
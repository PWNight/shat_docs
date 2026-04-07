import { twMerge } from "tailwind-merge";
import clsx, { ClassValue } from "clsx";
import {
    AlignmentType,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
    BorderStyle,
    ShadingType,
    PageOrientation,
} from "docx";
import { saveAs } from "file-saver";
import {
    AttendanceStudent,
    AttendanceTotal,
    GradeStudent,
    Group,
    MONTH_NAMES,
    SEMESTER_NAMES,
} from "@/utils/interfaces";

const COLORS = {
    headerBg: "E5E7EB",
    border: "9CA3AF",
    totalBg: "F3F4F6",
    sick: "D97706",
    late: "DC2626",
    grade5: "DCFCE7",
    grade2: "FEE2E2",
};

const formatSubject = (name: string): string => {
    const clean = name.replace(/\s+/g, " ");
    return clean.length > 12 ? clean.slice(0, 12) + "…" : clean;
};

type CellOptions = {
    bold?: boolean;
    align?: "start" | "center" | "end" | "both" | "mediumKashida" | "distribute" | "numTab" | "highKashida" | "lowKashida" | "thaiDistribute" | "left" | "right" | undefined;
    shading?: string;
    size?: number;
    color?: string;
    width?: number;
};

const createCell = (text: string, options: CellOptions = {}): TableCell => {
    return new TableCell({
        width: options.width
            ? { size: options.width, type: WidthType.PERCENTAGE }
            : undefined,
        children: [
            new Paragraph({
                alignment: options.align ?? AlignmentType.LEFT,
                spacing: { before: 80, after: 80 },
                children: [
                    new TextRun({
                        text,
                        bold: options.bold,
                        size: options.size ?? 20,
                        color: options.color,
                    }),
                ],
            }),
        ],
        verticalAlign: VerticalAlign.CENTER,
        shading: options.shading
            ? { fill: options.shading, type: ShadingType.CLEAR }
            : undefined,
        borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
            left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
            right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        },
    });
};

export const exportGradesToWord = async (
    students: GradeStudent[],
    group: Group
): Promise<void> => {
    if (!students.length) return;

    const subjects = students[0].subjects;

    const fioWidth = 30;
    const avgWidth = 10;
    const subjectWidth = Math.floor(
        (100 - fioWidth - avgWidth) / subjects.length
    );

    const periodSemester = students[0]?.periodSemester;
    const semesterText = periodSemester ? SEMESTER_NAMES[periodSemester as 1 | 2] : "";
    
    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        size: {
                            orientation: PageOrientation.LANDSCAPE,
                        },
                        margin: { top: 700, bottom: 700, left: 700, right: 700 },
                    },
                },
                children: [
                    new Paragraph({
                        text: "ВЕДОМОСТЬ УСПЕВАЕМОСТИ",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                    }),
                    new Paragraph({
                        text: `Группа: ${group.name}`,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 },
                    }),
                    ...(semesterText ? [new Paragraph({
                        text: `Полугодие: ${semesterText}`,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 },
                    })] : [new Paragraph({
                        text: "",
                        spacing: { after: 300 },
                    })]),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                tableHeader: true,
                                children: [
                                    createCell("ФИО студента", {
                                        bold: true,
                                        shading: COLORS.headerBg,
                                        width: fioWidth,
                                        size: 16,
                                    }),
                                    ...subjects.map((s) =>
                                        createCell(formatSubject(s.name), {
                                            bold: true,
                                            align: AlignmentType.CENTER,
                                            shading: COLORS.headerBg,
                                            width: subjectWidth,
                                            size: 16,
                                        })
                                    ),
                                    createCell("Средний балл", {
                                        bold: true,
                                        align: AlignmentType.CENTER,
                                        shading: COLORS.headerBg,
                                        width: avgWidth,
                                        size: 16,
                                    }),
                                ],
                            }),
                            ...students.map((s) => {
                                const avg = Number(s.averageScore);
                                return new TableRow({
                                    children: [
                                        createCell(s.fullName, {
                                            bold: true,
                                            width: fioWidth,
                                            size: 16,
                                        }),
                                        ...s.subjects.map((sub) => {
                                            const g = parseInt(sub.grade);
                                            return createCell(sub.grade || "-", {
                                                align: AlignmentType.CENTER,
                                                bold: true,
                                                width: subjectWidth,
                                                size: 16,
                                                shading:
                                                    g === 5
                                                        ? COLORS.grade5
                                                        : g <= 2 && g > 0
                                                            ? COLORS.grade2
                                                            : undefined,
                                            });
                                        }),
                                        createCell(
                                            !isNaN(avg) ? avg.toFixed(2) : "-",
                                            {
                                                align: AlignmentType.CENTER,
                                                bold: true,
                                                shading: COLORS.totalBg,
                                                width: avgWidth,
                                                size: 16,
                                            }
                                        ),
                                    ],
                                });
                            }),
                        ],
                    }),
                    new Paragraph({ text: "", spacing: { after: 400 } }),
                    new Paragraph({
                        children: [
                            new TextRun("Преподаватель: _____________________"),
                        ],
                        spacing: { after: 200 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(
                                `Дата: ${new Date().toLocaleDateString("ru-RU")}`
                            ),
                        ],
                    }),
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Успеваемость_${group.name}.docx`);
};

export const exportToWord = async (
    students: AttendanceStudent[],
    total: AttendanceTotal,
    group: Group
): Promise<void> => {
    if (!students.length) return;

    const periodMonth = students[0]?.periodMonth;
    const monthText = periodMonth ? MONTH_NAMES[periodMonth as keyof typeof MONTH_NAMES] : "";

    const doc = new Document({
        sections: [
            {
                children: [
                    new Paragraph({
                        text: "ОТЧЕТ ПО ПОСЕЩАЕМОСТИ",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                    }),
                    new Paragraph({
                        text: `Группа: ${group.name}`,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 },
                    }),
                    ...(monthText ? [new Paragraph({
                        text: `Месяц: ${monthText}`,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 },
                    })] : [new Paragraph({
                        text: "",
                        spacing: { after: 300 },
                    })]),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                tableHeader: true,
                                children: [
                                    createCell("ФИО студента", {
                                        bold: true,
                                        shading: COLORS.headerBg,
                                        width: 30,
                                    }),
                                    createCell("Полные дни", {
                                        bold: true,
                                        shading: COLORS.headerBg,
                                        align: AlignmentType.CENTER,
                                    }),
                                    createCell("Болезнь (дни)", {
                                        bold: true,
                                        shading: COLORS.headerBg,
                                        align: AlignmentType.CENTER,
                                    }),
                                    createCell("Всего уроков", {
                                        bold: true,
                                        shading: COLORS.headerBg,
                                        align: AlignmentType.CENTER,
                                    }),
                                    createCell("Болезнь (уроки)", {
                                        bold: true,
                                        shading: COLORS.headerBg,
                                        align: AlignmentType.CENTER,
                                    }),
                                    createCell("Опоздания", {
                                        bold: true,
                                        shading: COLORS.headerBg,
                                        align: AlignmentType.CENTER,
                                    }),
                                ],
                            }),
                            ...students.map((s) => {
                                return new TableRow({
                                    children: [
                                        createCell(s.fullName, { width: 30 }),
                                        createCell(String(s.fullDaysTotal), {
                                            align: AlignmentType.CENTER,
                                        }),
                                        createCell(String(s.fullDaysSick), {
                                            align: AlignmentType.CENTER,
                                            color: COLORS.sick,
                                        }),
                                        createCell(String(s.lessonsTotal), {
                                            align: AlignmentType.CENTER,
                                        }),
                                        createCell(String(s.lessonsSick), {
                                            align: AlignmentType.CENTER,
                                            color: COLORS.sick,
                                        }),
                                        createCell(String(s.late), {
                                            align: AlignmentType.CENTER,
                                            color: COLORS.late,
                                            bold: s.late > 0,
                                        }),
                                    ],
                                });
                            }),
                            new TableRow({
                                children: [
                                    createCell("ИТОГО", {
                                        bold: true,
                                        shading: COLORS.totalBg,
                                    }),
                                    createCell(String(total.fullDaysTotal), {
                                        align: AlignmentType.CENTER,
                                    }),
                                    createCell(String(total.fullDaysSick), {
                                        align: AlignmentType.CENTER,
                                        color: COLORS.sick,
                                    }),
                                    createCell(String(total.lessonsTotal), {
                                        align: AlignmentType.CENTER,
                                    }),
                                    createCell(String(total.lessonsSick), {
                                        align: AlignmentType.CENTER,
                                        color: COLORS.sick,
                                    }),
                                    createCell(String(total.late), {
                                        align: AlignmentType.CENTER,
                                        color: COLORS.late,
                                    }),
                                ],
                            }),
                        ],
                    }),
                    new Paragraph({ text: "", spacing: { after: 400 } }),
                    new Paragraph({
                        children: [
                            new TextRun("Преподаватель: _____________________"),
                        ],
                        spacing: { after: 200 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(
                                `Дата: ${new Date().toLocaleDateString("ru-RU")}`
                            ),
                        ],
                    }),
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Посещаемость_${group.name}.docx`);
};

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type ApiResponseBody = {
    success?: boolean;
    message?: string;
    error?: string;
    data?: unknown;
};

function parseResponseBody(response: Response): Promise<ApiResponseBody | null> {
    return response
        .text()
        .then((raw) => {
            if (!raw) return null;
            try {
                return JSON.parse(raw) as ApiResponseBody;
            } catch {
                return null;
            }
        });
}

// Утилита для обработки API ответов с защитой от невалидного JSON
export async function handleApiResponse(response: Response): Promise<ApiResponseBody> {
    const body = await parseResponseBody(response);

    if (!response.ok) {
        const messageFromBody = body?.message ?? body?.error;
        const message = messageFromBody
            ? `${messageFromBody} (err ${response.status})`
            : `Ошибка запроса (err ${response.status})`;

        throw new Error(message);
    }

    if (!body) {
        return { success: true };
    }

    return body;
}
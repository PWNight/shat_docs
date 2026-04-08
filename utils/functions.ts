import { twMerge } from "tailwind-merge";
import clsx, { ClassValue } from "clsx";
import { logger } from "@/utils/logger";
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

// Цвета для таблиц
const COLORS = {
    headerBg: "E5E7EB",
    border: "9CA3AF",
    totalBg: "F3F4F6",
    sick: "D97706",
    late: "DC2626",
    grade5: "DCFCE7",
    grade2: "FEE2E2",
};

// Функция для форматирования названия предмета
const formatSubject = (name: string): string => {
    const clean = name.replace(/\s+/g, " ");
    return clean.length > 12 ? clean.slice(0, 12) + "…" : clean;
};

// Опции для ячейки таблицы
type CellOptions = {
    bold?: boolean;
    align?: "start" | "center" | "end" | "both" | "mediumKashida" | "distribute" | "numTab" | "highKashida" | "lowKashida" | "thaiDistribute" | "left" | "right" | undefined;
    shading?: string;
    size?: number;
    color?: string;
    width?: number;
};

// Функция для создания ячейки таблицы
const createCell = (text: string, options: CellOptions = {}): TableCell => {
    return new TableCell({
        // Устанавливаем ширину ячейки
        width: options.width
            ? { size: options.width, type: WidthType.PERCENTAGE }
            : undefined,
        // Устанавливаем текст ячейки
        children: [
            new Paragraph({
                // Устанавливаем выравнивание текста
                alignment: options.align ?? AlignmentType.LEFT,
                // Устанавливаем отступы текста
                spacing: { before: 80, after: 80 },
                // Устанавливаем текст ячейки
                children: [
                    // Устанавливаем текст ячейки
                    new TextRun({
                        text,
                        // Устанавливаем жирность, размер и цвет текста
                        bold: options.bold,
                        size: options.size ?? 20,
                        color: options.color,
                    }),
                ],
            }),
        ],
        // Устанавливаем вертикальное выравнивание текста
        verticalAlign: VerticalAlign.CENTER,
        // Устанавливаем затенение ячейки
        shading: options.shading
            ? { fill: options.shading, type: ShadingType.CLEAR }
            : undefined,
        // Устанавливаем границы ячейки
        borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
            left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
            right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        },
    });
};

// Функция для экспорта успеваемости в Word
export const exportGradesToWord = async (
    students: GradeStudent[],
    group: Group
): Promise<void> => {
    // Проверяем, есть ли студенты
    if (!students.length) return;

    // Получаем предметы студента
    const subjects = students[0].subjects;

    // Получаем ширину для ФИО, среднего балла и предметов
    const fioWidth = 30;
    const avgWidth = 10;
    // Получаем ширину для предметов
    const subjectWidth = Math.floor(
        (100 - fioWidth - avgWidth) / subjects.length
    );

    // Получаем полугодие
    const periodSemester = students[0]?.periodSemester;
    const semesterText = periodSemester ? SEMESTER_NAMES[periodSemester as 1 | 2] : "";
    
    // Создаем документ Word
    const doc = new Document({
        sections: [
            {
                // Устанавливаем свойства страницы
                properties: {
                    page: {
                        size: {
                            orientation: PageOrientation.LANDSCAPE,
                        },
                        margin: { top: 700, bottom: 700, left: 700, right: 700 },
                    },
                },
                // Устанавливаем контент страницы
                children: [
                    // Устанавливаем заголовок
                    new Paragraph({
                        // Устанавливаем текст заголовка
                        text: "ВЕДОМОСТЬ УСПЕВАЕМОСТИ",
                        // Устанавливаем уровень заголовка
                        heading: HeadingLevel.HEADING_1,
                        // Устанавливаем выравнивание текста
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                    }),
                    // Устанавливаем текст группы
                    new Paragraph({
                        // Устанавливаем текст группы
                        text: `Группа: ${group.name}`,
                        // Устанавливаем выравнивание текста
                        alignment: AlignmentType.CENTER,
                        // Устанавливаем отступы текста
                        spacing: { after: 100 },
                    }),
                    // Устанавливаем текст полугодие
                    ...(semesterText ? [new Paragraph({
                        // Устанавливаем текст полугодие
                        text: `Полугодие: ${semesterText}`,
                        // Устанавливаем выравнивание текста
                        alignment: AlignmentType.CENTER,
                        // Устанавливаем отступы текста
                        spacing: { after: 300 },
                    })] : [new Paragraph({
                        // Устанавливаем текст пустой строки
                        text: "",
                        // Устанавливаем отступы текста
                        spacing: { after: 300 },
                    })]),
                    // Устанавливаем таблицу
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        // Устанавливаем строки таблицы
                        rows: [
                            new TableRow({
                                tableHeader: true,
                                // Устанавливаем ячейки таблицы
                                children: [
                                    createCell("ФИО студента", {
                                        // Устанавливаем жирность текста
                                        bold: true,
                                        // Устанавливаем затенение ячейки
                                        shading: COLORS.headerBg,
                                        // Устанавливаем ширину ячейки
                                        width: fioWidth,
                                        size: 16,
                                    }),
                                    // Устанавливаем ячейки предметов
                                    ...subjects.map((s) =>
                                        createCell(formatSubject(s.name), {
                                            // Устанавливаем жирность текста
                                            bold: true,
                                            // Устанавливаем выравнивание текста
                                            align: AlignmentType.CENTER,
                                            // Устанавливаем затенение ячейки
                                            shading: COLORS.headerBg,
                                            // Устанавливаем ширину ячейки
                                            width: subjectWidth,
                                            size: 16,
                                        })
                                    ),
                                    // Устанавливаем ячейку среднего балла
                                    createCell("Средний балл", {
                                        bold: true,
                                        // Устанавливаем выравнивание текста
                                        align: AlignmentType.CENTER,
                                        // Устанавливаем затенение ячейки
                                        shading: COLORS.headerBg,
                                        width: avgWidth,
                                        size: 16,
                                    }),
                                ],
                            }),
                            // Устанавливаем строки студентов
                            ...students.map((s) => {
                                const avg = Number(s.averageScore);
                                // Устанавливаем строку студента
                                return new TableRow({
                                    children: [
                                        createCell(s.fullName, {
                                            // Устанавливаем жирность текста
                                            bold: true,
                                            // Устанавливаем ширину ячейки
                                            width: fioWidth,
                                            size: 16,
                                        }),
                                        // Устанавливаем ячейки предметов
                                        ...s.subjects.map((sub) => {
                                            // Устанавливаем оценку предмета
                                            const g = parseInt(sub.grade);
                                            return createCell(sub.grade || "-", {
                                                // Устанавливаем выравнивание текста
                                                align: AlignmentType.CENTER,
                                                // Устанавливаем жирность текста
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
                                        // Устанавливаем ячейку среднего балла
                                        createCell(
                                            !isNaN(avg) ? avg.toFixed(2) : "-",
                                            {
                                                // Устанавливаем выравнивание текста
                                                align: AlignmentType.CENTER,
                                                // Устанавливаем жирность текста
                                                bold: true,
                                                // Устанавливаем затенение ячейки
                                                shading: COLORS.totalBg,
                                                // Устанавливаем ширину ячейки
                                                width: avgWidth,
                                                // Устанавливаем размер текста
                                                size: 16,
                                            }
                                        ),
                                    ],
                                });
                            }),
                        ],
                    }),
                    // Устанавливаем пустую строку
                    new Paragraph({ text: "", spacing: { after: 400 } }),
                    // Устанавливаем текст преподавателя
                    new Paragraph({
                        // Устанавливаем текст преподавателя
                        children: [
                            // Устанавливаем текст преподавателя
                            new TextRun("Преподаватель: _____________________"),
                        ],
                        // Устанавливаем отступы текста
                        spacing: { after: 200 },
                    }),
                    // Устанавливаем строку даты
                    new Paragraph({
                        // Устанавливаем текст даты
                        children: [
                            // Устанавливаем текст даты
                            new TextRun(
                                `Дата: ${new Date().toLocaleDateString("ru-RU")}`
                            ),
                        ],
                    }),
                ],
            },
        ],
    });

    // Создаем blob
    const blob = await Packer.toBlob(doc);
    // Сохраняем blob
    saveAs(blob, `Успеваемость_${group.name}.docx`);
};

// Функция для экспорта посещаемости в Word
export const exportToWord = async (
    students: AttendanceStudent[],
    total: AttendanceTotal,
    group: Group
): Promise<void> => {
    if (!students.length) return;

    // Получаем месяц
    const periodMonth = students[0]?.periodMonth;
    const monthText = periodMonth ? MONTH_NAMES[periodMonth as keyof typeof MONTH_NAMES] : "";

    // Создаем документ Word
    const doc = new Document({
        sections: [
            {
                // Устанавливаем контент страницы
                children: [
                    // Устанавливаем заголовок
                    new Paragraph({
                        // Устанавливаем текст заголовка
                        text: "ОТЧЕТ ПО ПОСЕЩАЕМОСТИ",
                        // Устанавливаем уровень заголовка
                        heading: HeadingLevel.HEADING_1,
                        // Устанавливаем выравнивание текста
                        alignment: AlignmentType.CENTER,
                        // Устанавливаем отступы текста
                        spacing: { after: 200 },
                    }),
                    // Устанавливаем текст группы
                    new Paragraph({
                        // Устанавливаем текст группы
                        text: `Группа: ${group.name}`,
                        // Устанавливаем выравнивание текста
                        alignment: AlignmentType.CENTER,
                        // Устанавливаем отступы текста
                        spacing: { after: 100 },
                    }),
                    // Устанавливаем текст месяца
                    ...(monthText ? [new Paragraph({
                        // Устанавливаем текст месяца
                        text: `Месяц: ${monthText}`,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 },
                    })] : [new Paragraph({
                        // Устанавливаем текст пустой строки
                        text: "",
                        // Устанавливаем отступы текста
                        spacing: { after: 300 },
                    })]),
                    // Устанавливаем таблицу
                    new Table({
                        // Устанавливаем ширину таблицы
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                tableHeader: true,
                                // Устанавливаем ячейки таблицы
                                children: [
                                    // Устанавливаем ячейку ФИО студента
                                    createCell("ФИО студента", {
                                        bold: true,
                                        shading: COLORS.headerBg,
                                        width: 30,
                                    }),
                                    // Устанавливаем ячейку Полные дни
                                    createCell("Полные дни", {
                                        bold: true,
                                        shading: COLORS.headerBg,
                                        align: AlignmentType.CENTER,
                                    }),
                                    // Устанавливаем ячейку Болезнь (дни)
                                    createCell("Болезнь (дни)", {
                                        bold: true,
                                        shading: COLORS.headerBg,
                                        align: AlignmentType.CENTER,
                                    }),
                                    // Устанавливаем ячейку Всего уроков
                                    createCell("Всего уроков", {
                                        bold: true,
                                        shading: COLORS.headerBg,
                                        align: AlignmentType.CENTER,
                                    }),
                                    // Устанавливаем ячейку Болезнь (уроки)
                                    createCell("Болезнь (уроки)", {
                                        bold: true,
                                        shading: COLORS.headerBg,
                                        align: AlignmentType.CENTER,
                                    }),
                                    // Устанавливаем ячейку Опоздания
                                    createCell("Опоздания", {
                                        bold: true,
                                        shading: COLORS.headerBg,
                                        align: AlignmentType.CENTER,
                                    }),
                                ],
                            }),
                            // Устанавливаем строки студентов
                            ...students.map((s) => {
                                // Устанавливаем строку студента
                                return new TableRow({
                                    children: [
                                        // Устанавливаем ячейку ФИО студента
                                        createCell(s.fullName, { width: 30 }),
                                        // Устанавливаем ячейку Полные дни
                                        createCell(String(s.fullDaysTotal), {
                                            // Устанавливаем выравнивание текста
                                            align: AlignmentType.CENTER,
                                        }),
                                        createCell(String(s.fullDaysSick), {
                                            // Устанавливаем выравнивание текста
                                            align: AlignmentType.CENTER,
                                            color: COLORS.sick,
                                        }),
                                        createCell(String(s.lessonsTotal), {
                                            // Устанавливаем выравнивание текста
                                            align: AlignmentType.CENTER,
                                        }),
                                        createCell(String(s.lessonsSick), {
                                            // Устанавливаем выравнивание текста
                                            align: AlignmentType.CENTER,
                                            color: COLORS.sick,
                                        }),
                                        createCell(String(s.late), {
                                            // Устанавливаем выравнивание текста
                                            align: AlignmentType.CENTER,
                                            color: COLORS.late,
                                            // Устанавливаем жирность текста
                                            bold: s.late > 0,
                                        }),
                                    ],
                                });
                            }),
                            // Устанавливаем строку итого
                            new TableRow({
                                // Устанавливаем ячейки таблицы
                                children: [
                                    // Устанавливаем ячейку ИТОГО
                                    createCell("ИТОГО", {
                                        // Устанавливаем жирность текста
                                        bold: true,
                                        shading: COLORS.totalBg,
                                    }),
                                    // Устанавливаем ячейку Полные дни
                                    createCell(String(total.fullDaysTotal), {
                                        align: AlignmentType.CENTER,
                                    }),
                                    // Устанавливаем ячейку Болезнь (дни)
                                    createCell(String(total.fullDaysSick), {
                                        align: AlignmentType.CENTER,
                                        color: COLORS.sick,
                                    }),
                                    // Устанавливаем ячейку Всего уроков
                                    createCell(String(total.lessonsTotal), {
                                        align: AlignmentType.CENTER,
                                    }),
                                    // Устанавливаем ячейку Болезнь (уроки)
                                    createCell(String(total.lessonsSick), {
                                        align: AlignmentType.CENTER,
                                        color: COLORS.sick,
                                    }),
                                    // Устанавливаем ячейку Опоздания
                                    createCell(String(total.late), {
                                        align: AlignmentType.CENTER,
                                        color: COLORS.late,
                                    }),
                                ],
                            }),
                        ],
                    }),
                    // Устанавливаем пустую строку
                    new Paragraph({ text: "", spacing: { after: 400 } }),
                    // Устанавливаем текст преподавателя
                    new Paragraph({
                        // Устанавливаем текст преподавателя
                        children: [
                            // Устанавливаем текст преподавателя
                            new TextRun("Преподаватель: _____________________"),
                        ],
                        spacing: { after: 200 },
                    }),
                    // Устанавливаем строку даты    
                    new Paragraph({
                        // Устанавливаем текст даты
                        children: [
                            // Устанавливаем текст даты
                            new TextRun(
                                `Дата: ${new Date().toLocaleDateString("ru-RU")}`
                            ),
                        ],
                    }),
                ],
            },
        ],
    });

    // Создаем blob
    const blob = await Packer.toBlob(doc);
    // Сохраняем blob
    saveAs(blob, `Посещаемость_${group.name}.docx`);
};

// Функция для объединения классов Tailwind
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Тип для тела ответа API
type ApiResponseBody = {
    success?: boolean;
    message?: string;
    code?: string;
    error?: string;
    data?: unknown;
};

// Класс для ошибки API
export class ApiResponseError extends Error {
    status: number;
    code?: string;
    // Конструктор ошибки API
    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = "ApiResponseError";
        this.status = status;
        this.code = code;
    }
}

// Функция для парсинга тела ответа API
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

// Функция для обработки ответа API
export async function handleApiResponse(response: Response): Promise<ApiResponseBody> {
    const body = await parseResponseBody(response);

    // Проверяем, является ли ответ успешным
    if (!response.ok) {
        // Получаем сообщение из тела ответа
        const messageFromBody = body?.message ?? body?.error;
        // Создаем сообщение об ошибке
        const message = messageFromBody
            ? `${messageFromBody} (err ${response.status})`
            : `Ошибка запроса (err ${response.status})`;

        // Получаем код ошибки из тела ответа
        const apiCode = body?.code ?? body?.error;
        // Логируем ошибку
        logger.warn("API request failed", { status: response.status, code: apiCode, message: messageFromBody });
        throw new ApiResponseError(message, response.status, apiCode);
    }

    // Проверяем, есть ли тело ответа
    if (!body) {
        return { success: true };
    }

    // Возвращаем тело ответа
    return body;
}
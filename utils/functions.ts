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
    AttendanceReportData,
    GradeStudent,
    GradesReportData,
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
    // Разделяем текст по переносам строк для создания отдельных параграфов
    const lines = text.split('\n');
    
    return new TableCell({
        children: lines.map((line, index) => 
            new Paragraph({
                children: [
                    new TextRun({
                        text: line,
                        bold: options.bold || false,
                        size: options.size || 20,
                        break: index > 0 ? 1 : 0, // Добавляем перенос строки для последующих строк
                    }),
                ],
                alignment: options.align || AlignmentType.LEFT,
                spacing: index < lines.length - 1 ? { after: 50 } : {}, // Добавляем небольшой отступ между строками
            })
        ),
        width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
        // Устанавливаем вертикальное выравнивание текста
        verticalAlign: VerticalAlign.TOP, // Изменяем на TOP для лучшего отображения столбцов
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

// Функция для создания данных отчёта по успеваемости для редактирования
export const createGradesReportData = (
    students: GradeStudent[],
    group: Group
): GradesReportData | null => {
    // Проверяем, есть ли студенты
    if (!students.length) return null;

    // Получаем полугодие
    const periodSemester = students[0]?.periodSemester;
    const semesterText = periodSemester ? SEMESTER_NAMES[periodSemester as 1 | 2] : "";
    
    // Вычисляем статистику для отчёта
    const totalStudents = students.length;
    const excellentStudents = students.filter(s => s.averageScore >= 4.5).length;
    const goodStudents = students.filter(s => s.averageScore >= 3.5 && s.averageScore < 4.5).length;
    const failingStudents = students.filter(s => s.subjects.some(sub => {
        const grade = parseInt(sub.grade);
        return grade === 2 || sub.grade === '';
    })).length;
    
    // Получаем старосту (несколько студентов как в образце)
    const groupLeader = students.length > 0 ? students.slice(0, 2).map(s => s.fullName).join(',\n') : '';

    return {
        semesterText,
        totalStudents,
        excellentStudents,
        goodStudents,
        failingStudents,
        groupLeader,
        performance1: totalStudents - failingStudents,
        quality1: excellentStudents + goodStudents,
        unrespectful: '',
        events: '',
        achievements: '',
        groupWins: '',
        clubs: '',
        classHours: '',
        violations: '',
    };
};

// Функция для экспорта успеваемости в Word с пользовательскими данными
export const exportGradesToWord = async (
    students: GradeStudent[],
    group: Group,
    customData?: Partial<GradesReportData>
): Promise<void> => {
    // Проверяем, есть ли студенты
    if (!students.length) return;

    // Используем пользовательские данные или вычисляем по умолчанию
    const data = customData || createGradesReportData(students, group);
    if (!data) return;

    const semesterText = data.semesterText || '';
    const totalStudents = data.totalStudents || students.length;
    const excellentStudents = data.excellentStudents || 0;
    const groupLeader = data.groupLeader || '';
    
    // Создаем документ Word
    const doc = new Document({
        sections: [
            {
                // Устанавливаем свойства страницы
                properties: {
                    page: {
                        size: {
                            orientation: PageOrientation.PORTRAIT,
                        },
                        margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
                    },
                },
                // Устанавливаем контент страницы
                children: [
                    // Устанавливаем заголовок - точно как в образце
                    new Paragraph({
                        // Устанавливаем текст заголовка
                        children: [
                            new TextRun({
                                text: "ОТЧЕТ",
                                bold: true,
                                size: 28,
                            }),
                        ],
                        // Устанавливаем выравнивание текста
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                    }),
                    // Устанавливаем подзаголовок - точно как в образце
                    new Paragraph({
                        // Устанавливаем текст подзаголовка
                        children: [
                            new TextRun({
                                text: `по итогам работы группы за ${semesterText}`,
                                bold: true,
                                size: 24,
                            }),
                        ],
                        // Устанавливаем выравнивание текста
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),
                    
                    // Заголовок для конкурсных критериев - точно как в образце
                    new Paragraph({
                        // Устанавливаем текст заголовка
                        children: [
                            new TextRun({
                                text: "КОНКУРСНЫЕ КРИТЕРИИ ОЦЕНКИ",
                                bold: true,
                                size: 24,
                            }),
                        ],
                        // Устанавливаем выравнивание текста
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),
                    
                    // Таблица 1: Информация о группе - без заливки
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    createCell("Группа №", { bold: true, align: AlignmentType.CENTER }),
                                    createCell("Количество человек в группе по списку", { bold: true, align: AlignmentType.CENTER }),
                                    createCell("Староста группы", { bold: true, align: AlignmentType.CENTER }),
                                    createCell("Классный воспитатель", { bold: true, align: AlignmentType.CENTER }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell(group.name, { align: AlignmentType.CENTER }),
                                    createCell(String(totalStudents), { align: AlignmentType.CENTER }),
                                    createCell(groupLeader, { align: AlignmentType.CENTER }),
                                    createCell(data.classTeacher || group.leader || "-", { align: AlignmentType.CENTER }),
                                ],
                            }),
                        ],
                    }),
                    
                    // Пустая строка между таблицами
                    new Paragraph({ text: "", spacing: { after: 300 } }),
                    
                    // Таблица 2: Конкурсные критерии оценки - без заливки
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    createCell("1. Успеваемость в группе (количество человек в группе без «2» и неаттестованных по предметам)", { 
                                        bold: true,
                                        width: 70
                                    }),
                                    createCell(String(data.performance1 || totalStudents), { 
                                        align: AlignmentType.CENTER,
                                        width: 30
                                    }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell("2. Качество знаний: обучаются на «4» и «5»", { bold: true }),
                                    createCell(String(data.quality1 || 0), { align: AlignmentType.CENTER }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell("3. Количество отличников в группе", { bold: true }),
                                    createCell(String(excellentStudents), { align: AlignmentType.CENTER }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell("4. Количество человек в группе пропускающих занятия без уважительной причины и количество пропущенных часов у каждого студента", { 
                                        bold: true
                                    }),
                                    createCell(data.unrespectful || "-", { align: AlignmentType.CENTER }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell("5. Участие группы в мероприятиях техникума, города, области, региона, страны (указать мероприятия и количество участников из группы)", { 
                                        bold: true
                                    }),
                                    createCell(data.events || "-", { align: AlignmentType.CENTER }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell("6. Победа студента группы в любом виде деятельности (указать фамилию, имя, название мероприятия, указать призовое место)", { 
                                        bold: true
                                    }),
                                    createCell(data.achievements || "-", { align: AlignmentType.CENTER }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell("7. Победа группы в спортивных мероприятиях и профессиональных конкурсах, олимпиадах, научно-практических конференциях техникума (указать мероприятие, призовое место)", { 
                                        bold: true
                                    }),
                                    createCell(data.groupWins || "-", { align: AlignmentType.CENTER }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell("8. Посещение кружков и секций (указать количество человек и сколько раз посещали секцию)", { 
                                        bold: true
                                    }),
                                    createCell(data.clubs || "-", { align: AlignmentType.CENTER }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell("9. Проведение классных часов в группе (количество и тема)", { bold: true }),
                                    createCell(data.classHours || "-", { align: AlignmentType.CENTER }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell("10. Правонарушения в группе, количество человек получивших (указать фамилии)", { 
                                        bold: true
                                    }),
                                    createCell(data.violations || "-", { align: AlignmentType.CENTER }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell("- замечание", { bold: false }),
                                    createCell("", { align: AlignmentType.CENTER }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell("-выговор", { bold: false }),
                                    createCell("", { align: AlignmentType.CENTER }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell("- уголовное правонарушение", { bold: false }),
                                    createCell("", { align: AlignmentType.CENTER }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell("- административное правонарушение", { bold: false }),
                                    createCell("", { align: AlignmentType.CENTER }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell("- были приглашены на совет профилактики, педсовет", { bold: false }),
                                    createCell("", { align: AlignmentType.CENTER }),
                                ],
                            }),
                        ],
                    }),
                ],
            },
        ],
    });

    // Создаем blob
    const blob = await Packer.toBlob(doc);
    // Сохраняем blob
    saveAs(blob, `Отчет_по_группе_${group.name}.docx`);
};

// Функция для создания данных отчёта по посещаемости для редактирования
export const createAttendanceReportData = (
    students: AttendanceStudent[],
    total: AttendanceTotal,
    group: Group
): AttendanceReportData | null => {
    if (!students.length) return null;

    // Получаем месяц
    const periodMonth = students[0]?.periodMonth;
    const monthText = periodMonth ? MONTH_NAMES[periodMonth as keyof typeof MONTH_NAMES] : "";
    const currentYear = new Date().getFullYear();

    // Формируем информацию о пропусках по болезни - в столбик как в образце
    const sickStudents = students
        .filter(s => s.fullDaysSick > 0 || s.lessonsSick > 0)
        .map(s => {
            const sickDays = s.fullDaysSick > 0 ? `${s.fullDaysSick} дн.` : '';
            const sickLessons = s.lessonsSick > 0 ? `${s.lessonsSick} ч` : '';
            const sickInfo = [sickDays, sickLessons].filter(Boolean).join(', ');
            return `${s.fullName} – ${sickInfo}`;
        })
        .join('\n');

    // Формируем информацию о пропусках без уважительной причины - в столбик как в образце
    const unrespectfulStudents = students
        .filter(s => {
            // Предполагаем, что пропуски без уважительной причины = общие пропуски - пропуски по болезни
            const unrespectfulDays = s.fullDaysTotal - s.fullDaysSick;
            const unrespectfulLessons = s.lessonsTotal - s.lessonsSick;
            return unrespectfulDays > 0 || unrespectfulLessons > 0;
        })
        .map(s => {
            const unrespectfulDays = s.fullDaysTotal - s.fullDaysSick;
            const unrespectfulLessons = s.lessonsTotal - s.lessonsSick;
            const hours = Math.max(unrespectfulDays, unrespectfulLessons);
            return `${s.fullName} – ${hours} ч`;
        })
        .join('\n');

    // Формируем информацию о профилактической работе - в столбик как в образце
    const preventiveWork = students
        .filter(s => {
            const unrespectfulDays = s.fullDaysTotal - s.fullDaysSick;
            const unrespectfulLessons = s.lessonsTotal - s.lessonsSick;
            return unrespectfulDays > 0 || unrespectfulLessons > 0;
        })
        .map(s => `${s.fullName} – Индивидуальная беседа`)
        .join('\n');

    return {
        monthText,
        currentYear,
        totalStudents: students.length,
        sickStudents,
        respectfulAbsences: '',
        unrespectfulAbsences: unrespectfulStudents,
        preventiveWork,
        classTeacher: group.leader || '',
    };
};

// Функция для экспорта посещаемости в Word с пользовательскими данными
export const exportToWord = async (
    students: AttendanceStudent[],
    total: AttendanceTotal,
    group: Group,
    customData?: Partial<AttendanceReportData>
): Promise<void> => {
    if (!students.length) return;

    // Используем пользовательские данные или вычисляем по умолчанию
    const data = customData || createAttendanceReportData(students, total, group);
    if (!data) return;

    const monthText = data.monthText || '';
    const currentYear = data.currentYear || new Date().getFullYear();

    // Создаем документ Word
    const doc = new Document({
        sections: [
            {
                // Устанавливаем свойства страницы - альбомная ориентация
                properties: {
                    page: {
                        size: {
                            orientation: PageOrientation.LANDSCAPE,
                        },
                        margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
                    },
                },
                // Устанавливаем контент страницы
                children: [
                    // Устанавливаем заголовок - точно как в образце
                    new Paragraph({
                        // Устанавливаем текст заголовка
                        children: [
                            new TextRun({
                                text: `ОТЧЕТ по посещаемости`,
                                bold: true,
                                size: 28,
                            }),
                            new TextRun({
                                text: `\n${group.name} группа за ${monthText} ${currentYear} года.`,
                                bold: true,
                                size: 28,
                            }),
                        ],
                        // Устанавливаем выравнивание текста
                        alignment: AlignmentType.CENTER,
                        // Устанавливаем отступы текста
                        spacing: { after: 200 },
                    }),
                    // Устанавливаем текст классного руководителя - точно как в образце
                    new Paragraph({
                        // Устанавливаем текст классного руководителя
                        children: [
                            new TextRun({
                                text: `Классный руководитель`,
                                size: 24,
                            }),
                            new TextRun({
                                text: `\n${data.classTeacher || group.leader || '_________________'}`,
                                size: 24,
                            }),
                        ],
                        spacing: { after: 400 },
                    }),
                    
                    // Основная таблица посещаемости - без заливки, с улучшенными отступами
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    createCell("Всего студентов в группе", { 
                                        bold: true, 
                                        align: AlignmentType.CENTER,
                                        width: 20
                                    }),
                                    createCell("Пропущено по болезни (указать кол-во часов и Ф.И.О. студента)", { 
                                        bold: true, 
                                        align: AlignmentType.CENTER,
                                        width: 20
                                    }),
                                    createCell("Пропущено по уважительной причине (указать причину, кол-во часов, Ф.И.О. студента)", { 
                                        bold: true, 
                                        align: AlignmentType.CENTER,
                                        width: 20
                                    }),
                                    createCell("Пропущено без уважительной причины (указать кол-во часов, Ф.И.О. студента)", { 
                                        bold: true, 
                                        align: AlignmentType.CENTER,
                                        width: 20
                                    }),
                                    createCell("Проводимая профилактическая работа классного руководителя по устранению пропусков занятий без уважительной причины (указать отдельно по каждому студенту)", { 
                                        bold: true, 
                                        align: AlignmentType.CENTER,
                                        width: 20
                                    }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    createCell(String(data.totalStudents || students.length), { 
                                        align: AlignmentType.CENTER
                                    }),
                                    createCell(data.sickStudents || "-", { 
                                        align: AlignmentType.LEFT
                                    }),
                                    createCell(data.respectfulAbsences || "-", { 
                                        align: AlignmentType.LEFT
                                    }),
                                    createCell(data.unrespectfulAbsences || "-", { 
                                        align: AlignmentType.LEFT
                                    }),
                                    createCell(data.preventiveWork || "-", { 
                                        align: AlignmentType.LEFT
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            },
        ],
    });

    // Создаем blob
    const blob = await Packer.toBlob(doc);
    // Сохраняем blob
    saveAs(blob, `Отчет_по_посещаемости_${group.name}.docx`);
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
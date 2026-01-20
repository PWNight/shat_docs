'use client';
import React, {useEffect, useState} from 'react';
import {Upload, FileSpreadsheet, AlertCircle, FileText, Trash} from 'lucide-react';
import { Packer, Document, Table, TableRow, TableCell, Paragraph, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import {getSession} from "@/utils/session";
import {useRouter} from "next/navigation";

interface Student {
    number: string;
    fullName: string;
    fullDaysTotal: number;
    fullDaysSick: number;
    lessonsTotal: number;
    lessonsSick: number;
    late: number;
}

export default function Attendance() {
    // Объявляем переменные
    const [students, setStudents] = useState<Student[]>([]);
    const [totalFromFile, setTotalFromFile] = useState<Student | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        getSession()
            .then(async (session) => {
                if (!isMounted) return;

                if (!session) {
                    router.replace(`/login?to=/profile/attendance`);
                    return;
                }
            })
            .catch(err => {
                console.error("Ошибка при получении сессии:", err);
                return;
            });

        return () => {
            isMounted = false;
        };
    }, [router]);

    // Создаём функцию загрузки файла
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Получаем файл
        const file = e.target.files?.[0];
        if (!file) return;

        // Чистим переменные
        setError('');
        setFileName(file.name);
        setLoading(true);
        setStudents([]);
        setTotalFromFile(null);

        // Объявляем ридер
        const reader = new FileReader();
        reader.onload = (event) => {
            // Получаем текст данных из файла
            const text = event.target?.result as string;
            try {
                // Парсим документ, получая HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                const table = doc.querySelector('table.marks');
                if (!table) {
                    setError('Таблица посещаемости не найдена');
                    setLoading(false);
                    return;
                }
                // Получаем строки
                const rows = Array.from(table.querySelectorAll('tr'));
                const data: Student[] = [];

                // Проходимся по строкам
                rows.forEach((row) => {
                    const cells = Array.from(row.cells);

                    // Пропускаем пустые и заголовочные строки
                    if (cells.length === 0) return;
                    if (cells[0]?.rowSpan > 1) return;
                    if (cells.length === 4) return;

                    // Находим итог таблицы
                    if (cells.length === 5 || cells[0]?.colSpan === 2) {
                        const total: Student = {
                            number: '',
                            fullName: 'Итого',
                            fullDaysTotal: Number(cells[1]?.textContent?.trim() || 0),
                            fullDaysSick:    Number(cells[2]?.textContent?.trim() || 0),
                            lessonsTotal:    Number(cells[3]?.textContent?.trim() || 0),
                            lessonsSick:     Number(cells[4]?.textContent?.trim() || 0),
                            late:            Number(cells[5]?.textContent?.trim() || 0),
                        };
                        setTotalFromFile(total);
                        return;
                    }

                    // Находим студентов таблицы
                    if (cells.length >= 7) {
                        const numText = cells[0]?.textContent?.trim();
                        if (!numText || !/^\d+$/.test(numText)) return;

                        // Заносим данные в объект студента
                        const student: Student = {
                            number: numText,
                            fullName: cells[1]?.textContent?.trim() || '',
                            fullDaysTotal: Number(cells[2]?.textContent?.trim() || 0),
                            fullDaysSick:    Number(cells[3]?.textContent?.trim() || 0),
                            lessonsTotal:    Number(cells[4]?.textContent?.trim() || 0),
                            lessonsSick:     Number(cells[5]?.textContent?.trim() || 0),
                            late:            Number(cells[6]?.textContent?.trim() || 0),
                        };

                        data.push(student);
                    }
                });

                setStudents(data);
            } catch (err) {
                console.error("Ошибка работы парсера", error);
                const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка парсера";

                setError('Ошибка парсинга: ' + errorMessage);
            } finally {
                setLoading(false);
            }
        };

        reader.readAsText(file, 'utf-8');
    };

    async function exportToWord(){
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: 'Ведомость посещаемости',
                        heading: 'Heading1',
                        alignment: 'center',
                    }),
                    new Paragraph({
                        text: `Дата формирования: ${new Date().toLocaleDateString('ru-RU')}`,
                        spacing: { after: 400 },
                    }),

                    // Таблица
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1 },
                            bottom: { style: BorderStyle.SINGLE, size: 1 },
                            left: { style: BorderStyle.SINGLE, size: 1 },
                            right: { style: BorderStyle.SINGLE, size: 1 },
                            insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                            insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                        },
                        rows: [
                            // Заголовок
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph('№')], columnSpan: 1 }),
                                    new TableCell({ children: [new Paragraph('ФИО')], columnSpan: 1 }),
                                    new TableCell({ children: [new Paragraph('Полных дней')], columnSpan: 2 }),
                                    new TableCell({ children: [new Paragraph('Занятий')], columnSpan: 2 }),
                                    new TableCell({ children: [new Paragraph('Опоздания')], columnSpan: 1 }),
                                ]
                            }),
                            // Подзаголовок
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph('')] }),
                                    new TableCell({ children: [new Paragraph('')] }),
                                    new TableCell({ children: [new Paragraph('Всего')] }),
                                    new TableCell({ children: [new Paragraph('По болезни')] }),
                                    new TableCell({ children: [new Paragraph('Всего')] }),
                                    new TableCell({ children: [new Paragraph('По болезни')] }),
                                    new TableCell({ children: [new Paragraph('')] }),
                                ]
                            }),

                            // Данные студентов
                            ...students.map(s => new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph(s.number)] }),
                                    new TableCell({ children: [new Paragraph(s.fullName)] }),
                                    new TableCell({ children: [new Paragraph(s.fullDaysTotal.toString())] }),
                                    new TableCell({ children: [new Paragraph({ text: s.fullDaysSick.toString(), style: 'Strong' })] }),
                                    new TableCell({ children: [new Paragraph(s.lessonsTotal.toString())] }),
                                    new TableCell({ children: [new Paragraph({ text: s.lessonsSick.toString(), style: 'Strong' })] }),
                                    new TableCell({ children: [new Paragraph({ text: s.late.toString() })] }),
                                ]
                            })),

                            // Итоговая строка
                            ...(totalFromFile ? [
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph('')], columnSpan: 1 }),
                                        new TableCell({ children: [new Paragraph({ text: 'Итого' })], columnSpan: 1 }),
                                        new TableCell({ children: [new Paragraph({ text: totalFromFile.fullDaysTotal.toString() })] }),
                                        new TableCell({ children: [new Paragraph({ text: totalFromFile.fullDaysSick.toString() })] }),
                                        new TableCell({ children: [new Paragraph({ text: totalFromFile.lessonsTotal.toString() })] }),
                                        new TableCell({ children: [new Paragraph({ text: totalFromFile.lessonsSick.toString() })] }),
                                        new TableCell({ children: [new Paragraph({ text: totalFromFile.late.toString() })] }),
                                    ]
                                })
                            ] : [])
                        ]
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, 'посещаемость.docx');
    }

    return (
        <div className="lg:flex">
            <div className="flex flex-col gap-4">
                <div className="bg-white rounded-lg shadow-md p-4 mb-8">
                    <h1 className="w-fit sm:text-4xl text-3xl font-bold text-gray-900 mb-8">
                        Парсер посещаемости из .xls
                    </h1>
                    {students.length == 0 && (
                        <label className="flex flex-col items-center justify-center w-full h-52 border-4 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {loading ? (
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                                ) : (
                                    <>
                                        <Upload className="w-16 h-16 text-gray-400 mb-4" />
                                        <p className="mb-2 text-xl text-gray-600 text-center">Перетащите .xls файл из Дневник.ру</p>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept=".xls,.xlsx,text/html"
                                onChange={handleFileUpload}
                                disabled={loading}
                            />
                        </label>
                    )}

                    <div className='flex flex-col justify-between'>
                        {fileName && (
                            <div className="flex items-center text-green-600">
                                <FileSpreadsheet className="w-5 h-5 mr-2" />
                                <span className="font-medium">Загружен: {fileName}</span>
                            </div>
                        )}

                        {students.length > 0 && (
                            <div className="flex w-fit gap-2 mt-4 row-span-2">
                                <button
                                    onClick={exportToWord}
                                    className="flex items-center px-3 py-1 gap-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition shadow-md"
                                >
                                    <FileText className="w-5 h-5" />
                                    Скачать Word
                                </button>
                                <button
                                    onClick={()=>{
                                        setStudents([]);
                                        setFileName('')
                                    }}
                                    className="flex items-center px-3 py-1 gap-2 bg-red-700 text-white rounded-lg hover:bg-red-600 transition shadow-md"
                                >
                                    <Trash className="w-5 h-5" />
                                    Удалить файл
                                </button>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
                            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {students.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden h-fit">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-800 text-white">
                                <tr className="text-left text-xs font-medium">
                                    <th className="px-4 py-3">№</th>
                                    <th className="px-4 py-3">ФИО</th>
                                    <th colSpan={2} className="px-4 py-3">Полных дней</th>
                                    <th colSpan={2} className="px-4 py-3">Занятий</th>
                                    <th className="px-4 py-3">Опоздания</th>
                                </tr>
                                <tr className="bg-gray-700 text-xs">
                                    <th></th>
                                    <th></th>
                                    <th className="px-4 py-2">Всего</th>
                                    <th className="px-4 py-2">По болезни</th>
                                    <th className="px-4 py-2">Всего</th>
                                    <th className="px-4 py-2">По болезни</th>
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {students.map((s, i) => (
                                    <tr key={i} className="hover:bg-gray-50 text-sm">
                                        <td className="px-4 py-3 font-medium text-gray-900">{s.number}</td>
                                        <td className="px-4 py-3 text-gray-900">{s.fullName}</td>
                                        <td className="px-4 py-3 text-center">{s.fullDaysTotal}</td>
                                        <td className="px-4 py-3 text-center text-amber-600">{s.fullDaysSick}</td>
                                        <td className="px-4 py-3 text-center">{s.lessonsTotal}</td>
                                        <td className="px-4 py-3 text-center text-amber-600">{s.lessonsSick}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-red-600">{s.late}</td>
                                    </tr>
                                ))}

                                {totalFromFile && (
                                    <tr className="bg-gray-100 font-bold text-sm">
                                        <td colSpan={2} className="px-4 py-4 text-left">Итого</td>
                                        <td className="px-4 py-4 text-center">{totalFromFile.fullDaysTotal}</td>
                                        <td className="px-4 py-4 text-center">{totalFromFile.fullDaysSick}</td>
                                        <td className="px-4 py-4 text-center">{totalFromFile.lessonsTotal}</td>
                                        <td className="px-4 py-4 text-center">{totalFromFile.lessonsSick}</td>
                                        <td className="px-4 py-4 text-center text-red-600">{totalFromFile.late}</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
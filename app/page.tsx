'use client';

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface Student {
    number: string;
    fullName: string;
    fullDaysTotal: string;
    fullDaysSick: string;
    lessonsTotal: string;
    lessonsSick: string;
    late: string;
}

export default function Attendance() {
    // Создаём переменные
    const [students, setStudents] = useState<Student[]>([]);
    const [total, setTotal] = useState<Student | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // Функция загрузки файла
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Получаем файл. Если нет - возвращаем обратно.
        const file = e.target.files?.[0];
        if (!file) return;

        // Задаём значения переменным
        setError('');
        setFileName(file.name);
        setLoading(true);
        setStudents([]);
        setTotal(null);

        // Запускаем чтение
        const reader = new FileReader();
        reader.onload = (event) => {
            // Получаем текст из файла
            const text = event.target?.result as string;
            try {
                // Создаём временный DOM-парсер
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');

                // Ищем таблицу с классом "marks"
                const table = doc.querySelector('table.marks');
                if (!table) {
                    throw new Error('Не найдена таблица с посещаемостью');
                }

                // Получаем ряды данных
                const rows = Array.from(table.querySelectorAll('tr'));
                const data: Student[] = [];
                let totalRow: Student | null = null;

                // Запускаем цикл по рядам
                rows.forEach((row) => {
                    // Получаем заголовки
                    const cells = row.querySelectorAll('td');

                    // Пропускаем строки-заголовки (с rowspan/colspan)
                    if (cells.length < 5) return;

                    // Получаем ряд с итогом
                    const isTotalRow = row.classList.contains('strong') ||
                        cells[0]?.getAttribute('colspan') === '2' ||
                        cells[1]?.textContent?.trim() === 'Итого';

                    // Заполняем объект студента данными
                    const student: Student = {
                        number: cells[0]?.textContent?.trim() || '',
                        fullName: cells[1]?.textContent?.trim() || '',
                        fullDaysTotal: cells[2]?.textContent?.trim() || '0',
                        fullDaysSick: cells[3]?.textContent?.trim() || '0',
                        lessonsTotal: cells[4]?.textContent?.trim() || '0',
                        lessonsSick: cells[5]?.textContent?.trim() || '0',
                        late: cells[6]?.textContent?.trim() || '0',
                    };

                    // Если дошли до конца - выводим, иначе добавляем в массив
                    if (isTotalRow) {
                        totalRow = { ...student, fullName: 'Итого' };
                    } else if (student.number && student.fullName && !isNaN(parseInt(student.number))) {
                        data.push(student);
                    }
                });
                setStudents(data);
                setTotal(totalRow);

            // Ловим ошибки
            } catch (err: never) {
                console.error(err);
                setError(err.message || 'Не удалось распознать файл. Возможно, это не отчёт о посещаемости из Дневник.ру');
            // При завершении завершаем загрузку
            } finally {
                setLoading(false);
            }
        };

        // При ошибке останавливаем загрузку
        reader.onerror = () => {
            setError('Ошибка чтения файла');
            setLoading(false);
        };

        // Запускаем чтение файла
        reader.readAsText(file, 'utf-8');
    };

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
                    Парсер посещаемости из .xls
                </h1>
                <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                    <label className="flex flex-col items-center justify-center w-full h-64 border-4 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {loading ? (
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                            ) : (
                                <>
                                    <Upload className="w-16 h-16 text-gray-400 mb-4" />
                                    <p className="mb-2 text-xl text-gray-600">Перетащите .xls файл из Дневник.ру</p>
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

                    {fileName && (
                        <div className="mt-4 flex items-center text-green-600">
                            <FileSpreadsheet className="w-5 h-5 mr-2" />
                            <span className="font-medium">Загружен: {fileName}</span>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
                            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {students.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-800 text-white">
                                <tr className={'text-left text-xs font-medium'}>
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
                                {total && (
                                    <tr className="bg-gray-100 font-bold text-center text-sm">
                                        <td colSpan={2} className="px-4 py-4 text-left">Итого</td>
                                        <td className="px-4 py-4">{total.fullDaysTotal}</td>
                                        <td className="px-4 py-4">{total.fullDaysSick}</td>
                                        <td className="px-4 py-4">{total.lessonsTotal}</td>
                                        <td className="px-4 py-4">{total.lessonsSick}</td>
                                        <td className="px-4 py-4 text-red-600">{total.late}</td>
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
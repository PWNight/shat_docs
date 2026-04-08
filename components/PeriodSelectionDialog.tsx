"use client"
import { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription, DialogClose
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { MONTH_NAMES, SEMESTER_NAMES } from "@/utils/interfaces";

// Интерфейс для компонента PeriodSelectionDialog
interface PeriodSelectionDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (periodValue: number) => void;
    type: 'attendance' | 'grades';
    defaultValue?: number;
}

export default function PeriodSelectionDialog({
    open,
    onClose,
    onConfirm,
    type,
    defaultValue
}: PeriodSelectionDialogProps) {
    // Используем useState для выбора периода
    const [selectedPeriod, setSelectedPeriod] = useState<number | null>(defaultValue || null);

    // Функция для подтверждения выбора периода
    const handleConfirm = () => {
        // Проверяем, что период не пустой
        if (selectedPeriod === null) return;
        // Вызываем функцию для подтверждения выбора периода
        onConfirm(selectedPeriod);
        // Закрываем диалог
        onClose();
    };

    // Проверяем, что тип отчёта посещаемости
    const isAttendance = type === 'attendance';
    // Получаем список периодов
    const periodOptions = isAttendance
        ? Object.entries(MONTH_NAMES).map(([key, name]) => ({ value: parseInt(key), label: name })) // Если тип отчёта посещаемости, то получаем список месяцев
        : Object.entries(SEMESTER_NAMES).map(([key, name]) => ({ value: parseInt(key), label: name })); // Если тип отчёта успеваемости, то получаем список полугодий

    // Возвращаем компонент PeriodSelectionDialog
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className='text-left'>
                    <DialogTitle>
                        {isAttendance ? "Выберите месяц" : "Выберите полугодие"}
                    </DialogTitle>
                    <DialogDescription>
                        {isAttendance 
                            ? "Укажите месяц, за который представлена информация о посещаемости"
                            : "Укажите полугодие, за которое представлена информация об успеваемости"
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {isAttendance ? (
                        // Выбираем месяц (3 столбца)
                        <div className="grid grid-cols-3 gap-2">
                            {periodOptions.map(option => (
                                <button
                                    // Устанавливаем ключ для каждого периода
                                    key={option.value}
                                    onClick={() => setSelectedPeriod(option.value)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                        selectedPeriod === option.value
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        // Выбираем полугодие (радио кнопки)
                        <div className="space-y-3">
                            {periodOptions.map(option => (
                                <label
                                    // Устанавливаем ключ для каждого периода
                                    key={option.value}
                                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name="semester"
                                        value={option.value}
                                        checked={selectedPeriod === option.value}
                                        onChange={() => setSelectedPeriod(option.value)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {option.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className='flex flex-col gap-2'>
                    <Button
                        onClick={handleConfirm}
                        disabled={selectedPeriod === null}
                        className="w-full rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Подтвердить
                    </Button>
                    <Button variant="secondary" asChild>
                        <DialogClose>Отмена</DialogClose>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

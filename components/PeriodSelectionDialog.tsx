"use client"
import { useState } from 'react';
import { Loader2 } from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription, DialogClose
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { MONTH_NAMES, SEMESTER_NAMES } from "@/utils/interfaces";

interface PeriodSelectionDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (periodValue: number) => void | Promise<void>;
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
    const [selectedPeriod, setSelectedPeriod] = useState<number | null>(defaultValue || null);
    const [confirming, setConfirming] = useState(false);

    const handleConfirm = async () => {
        if (selectedPeriod === null || confirming) return;
        setConfirming(true);
        try {
            await onConfirm(selectedPeriod);
            onClose();
        } finally {
            setConfirming(false);
        }
    };

    const isAttendance = type === 'attendance';
    const periodOptions = isAttendance
        ? Object.entries(MONTH_NAMES).map(([key, name]) => ({ value: parseInt(key), label: name }))
        : Object.entries(SEMESTER_NAMES).map(([key, name]) => ({ value: parseInt(key), label: name }));

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !confirming) onClose(); }}>
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
                        <div className="grid grid-cols-3 gap-2">
                            {periodOptions.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    disabled={confirming}
                                    onClick={() => setSelectedPeriod(option.value)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                                        selectedPeriod === option.value
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {periodOptions.map(option => (
                                <label
                                    key={option.value}
                                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name="semester"
                                        value={option.value}
                                        disabled={confirming}
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
                        disabled={selectedPeriod === null || confirming}
                        className="w-full rounded-xl bg-blue-500 px-5 py-3 text-white font-semibold transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {confirming ? (
                            <span className="inline-flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Загрузка...
                            </span>
                        ) : (
                            "Подтвердить"
                        )}
                    </Button>
                    <Button variant="secondary" asChild disabled={confirming}>
                        <DialogClose>Отмена</DialogClose>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

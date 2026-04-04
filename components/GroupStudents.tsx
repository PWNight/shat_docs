"use client";
import React, { useState } from "react";
import { Edit, Trash2, Save, X, User, Loader2, RefreshCw } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/Dialog";
import { UpdateStudent, DeleteStudent, GetStudents } from "@/utils/handlers";
import { Group, Notify, Student } from "@/utils/interfaces";

interface GroupStudentsProps {
    groupId: string;
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    isOwner: boolean;
    setNotify: (notify: Notify) => void;
}

export default function GroupStudents({ groupId, students, setStudents, isOwner, setNotify }: GroupStudentsProps) {
    const [editingStudent, setEditingStudent] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [deleteStudentId, setDeleteStudentId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleEdit = (student: any) => {
        setEditingStudent(student.id);
        setEditName(student.full_name);
    };

    const handleSave = async () => {
        if (!editingStudent) return;

        const result = await UpdateStudent(groupId, editingStudent, editName);
        if (result.success) {
            setStudents(prev => prev.map(s => s.id === editingStudent ? { ...s, full_name: editName } : s));
            setNotify({ message: "Студент переименован", type: 'success' });
        } else {
            setNotify({ message: result.message || "Ошибка переименования", type: 'error' });
        }
        setEditingStudent(null);
    };

    const handleDelete = async () => {
        if (!deleteStudentId || isDeleting) return;

        setIsDeleting(true);
        const result = await DeleteStudent(groupId, deleteStudentId);
        setIsDeleting(false);
        if (result.success) {
            setStudents(prev => prev.filter(s => s.id !== deleteStudentId));
            setNotify({ message: "Студент удален", type: 'success' });
        } else {
            setNotify({ message: result.message || "Ошибка удаления", type: 'error' });
        }
        setDeleteStudentId(null);
    };

    const refreshStudents = async () => {
        setIsRefreshing(true);
        const result = await GetStudents(groupId);
        setIsRefreshing(false);
        if (result.success) {
            setStudents(result.data);
            setNotify({ message: "Список студентов обновлен", type: 'success' });
        } else {
            setNotify({ message: result.message || "Ошибка обновления списка", type: 'error' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Управление студентами</h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{students.length} студентов</span>
                    <button
                        onClick={refreshStudents}
                        disabled={isRefreshing}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-1 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Обновить список студентов"
                    >
                        <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                        Обновить
                    </button>
                </div>
            </div>

            {students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-lg">
                    <User className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                        Студенты появятся здесь после первого импорта посещаемости или успеваемости
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {students.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-4 bg-card border border-gray-100 dark:border-zinc-700 rounded-lg">
                            <div className="flex-1">
                                {editingStudent === student.id ? (
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-background"
                                        autoFocus
                                    />
                                ) : (
                                    <span className="text-foreground font-medium">{student.full_name}</span>
                                )}
                            </div>
                            {isOwner && (
                                <div className="flex items-center gap-2">
                                    {editingStudent === student.id ? (
                                        <>
                                            <button
                                                onClick={handleSave}
                                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md"
                                            >
                                                <Save size={16} />
                                            </button>
                                            <button
                                                onClick={() => setEditingStudent(null)}
                                                className="p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                                            >
                                                <X size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleEdit(student)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <button
                                                        onClick={() => setDeleteStudentId(student.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Удаление студента</DialogTitle>
                                                        <DialogDescription className="pt-2">
                                                            Вы действительно хотите удалить студента «{student.full_name}»?<br />
                                                            Это также удалит все его записи посещаемости и успеваемости.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <DialogFooter className="gap-3 sm:gap-4">
                                                        <button
                                                            onClick={handleDelete}
                                                            disabled={isDeleting}
                                                            className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                        >
                                                            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : null}
                                                            {isDeleting ? "Удаление..." : "Да, удалить"}
                                                        </button>
                                                        <DialogClose className="flex-1 bg-gray-200 dark:bg-zinc-700 py-3 rounded-lg font-medium">
                                                            Отмена
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
"use client";

import { PlusCircle, SquarePen, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActionButton } from "./AdminUi";
import type { AdminOverview, GroupItem } from "@/app/admin/types";

type GroupsTabProps = {
    data: AdminOverview;
    userId: number;
    newGroupName: string;
    newGroupTeacherId: string;
    busy: boolean;
    actionKey: string | null;
    onNewGroupNameChange: (value: string) => void;
    onNewGroupTeacherChange: (value: string) => void;
    onCreateGroup: () => void;
    onStartEditGroup: (group: GroupItem) => void;
    onRequestDeleteGroup: (groupId: number) => void;
};

export default function GroupsTab({
    data,
    userId,
    newGroupName,
    newGroupTeacherId,
    busy,
    actionKey,
    onNewGroupNameChange,
    onNewGroupTeacherChange,
    onCreateGroup,
    onStartEditGroup,
    onRequestDeleteGroup,
}: GroupsTabProps) {
    const teacherOptions = data.users.filter((u) => u.registration_status === "approved");

    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">Обзор и управление группами</h2>
            <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 w-full">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                    <input
                        className="w-full sm:flex-1 border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Название группы"
                        value={newGroupName}
                        maxLength={80}
                        onChange={(e) => onNewGroupNameChange(e.target.value)}
                    />

                    <select
                        className="w-full sm:w-[260px] border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={newGroupTeacherId}
                        onChange={(e) => onNewGroupTeacherChange(e.target.value)}
                    >
                        <option value="">Выберите преподавателя</option>
                        {teacherOptions.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.full_name} ({u.email})
                            </option>
                        ))}
                    </select>

                    <ActionButton
                        loading={actionKey === "create-group"}
                        disabled={busy}
                        onClick={onCreateGroup}
                        className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold px-5 py-2 text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>Создать</span>
                    </ActionButton>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-4">
                {data.groups.map((group) => {
                    const isOwner = group.fk_user === userId;
                    const stat = data.groupStats.find((g) => g.id === group.id);
                    const attendancePercent = stat && stat.lessons_total > 0
                        ? (((stat.lessons_total - stat.lessons_sick) / stat.lessons_total) * 100).toFixed(1)
                        : "0";
                    return (
                        <div
                            key={group.id}
                            className={`
                                group relative flex flex-col p-5 rounded-2xl border
                                bg-card border-border
                                shadow-sm hover:shadow-xl hover:-translate-y-1
                                transition-all duration-300
                                ${isOwner ? "ring-1 ring-blue-500/30 border-blue-500/40" : ""}
                            `}
                        >
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />

                            <div className="flex justify-between items-start mb-3 relative z-10">
                                <div
                                    className={`p-3 rounded-xl transition-all ${
                                        isOwner
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                                            : "bg-muted text-foreground"
                                    }`}
                                >
                                    <Users className="w-6 h-6" />
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    {isOwner && (
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-blue-600 text-white rounded-full shadow-sm">
                                            Ваша группа
                                        </span>
                                    )}

                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1
                                        bg-muted text-muted-foreground
                                        rounded-full border border-border break-all">
                                        ID: {group.id}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold tracking-tight mb-2 text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {group.name}
                            </h3>

                            <p className="text-sm text-muted-foreground mb-3">
                                Владелец:{" "}
                                <span className="font-medium text-foreground">
                                    {group.owner_name || "—"}
                                </span>
                            </p>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="rounded-xl bg-muted/60 p-3 border border-border">
                                    <p className="text-xs text-muted-foreground">Студенты</p>
                                    <p className="text-lg font-bold">{stat?.students_count ?? 0}</p>
                                </div>

                                <div className="rounded-xl bg-muted/60 p-3 border border-border">
                                    <p className="text-xs text-muted-foreground">Ср. балл</p>
                                    <p className="text-lg font-bold">{stat?.avg_grade ?? "—"}</p>
                                </div>

                                <div className="rounded-xl bg-muted/60 p-3 border border-border">
                                    <p className="text-xs text-muted-foreground">Посещаемость</p>
                                    <p className="text-lg font-bold">{attendancePercent}%</p>
                                </div>

                                <div className="rounded-xl bg-muted/60 p-3 border border-border">
                                    <p className="text-xs text-muted-foreground">Опоздания</p>
                                    <p className="text-lg font-bold">{stat?.late_total ?? 0}</p>
                                </div>
                            </div>

                            <div className="flex sm:flex-row flex-col gap-2 mt-auto">
                                <Button
                                    className="
                                        flex items-center justify-center gap-2 px-3 py-2 w-full
                                        bg-blue-600 hover:bg-blue-700
                                        dark:bg-blue-700 dark:hover:bg-blue-600
                                        text-white font-medium rounded-lg text-sm
                                        transition-all shadow-sm hover:shadow-md
                                    "
                                    onClick={() => onStartEditGroup(group)}
                                >
                                    <SquarePen className="w-4 h-4" /> Редактировать
                                </Button>

                                <ActionButton
                                    loading={actionKey === `delete-group-${group.id}`}
                                    disabled={busy}
                                    onClick={() => onRequestDeleteGroup(group.id)}
                                    className="
                                        w-full rounded-lg px-3 py-2 text-sm font-medium
                                        flex items-center justify-center gap-2 transition-all
                                        bg-red-50 hover:bg-red-500
                                        dark:bg-red-900/20 dark:hover:bg-red-500
                                        text-red-600 hover:text-white
                                        dark:text-red-400
                                        border border-red-200 dark:border-red-900/30
                                        hover:border-red-500
                                        shadow-sm hover:shadow-md
                                    "
                                >
                                    <Trash2 className="w-4 h-4" /> Удалить
                                </ActionButton>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

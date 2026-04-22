"use client";

import type { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { ActionButton } from "./AdminUi";
import type { AdminOverview } from "@/app/admin/types";

type AdminDialogsProps = {
    data: AdminOverview;
    groupEditId: number | null;
    setGroupEditId: (id: number | null) => void;
    groupDrafts: Record<number, { name: string; fk_user: string }>;
    setGroupDrafts: Dispatch<SetStateAction<Record<number, { name: string; fk_user: string }>>>;
    saveGroup: (groupId: number) => void;
    groupDeleteId: number | null;
    setGroupDeleteId: (id: number | null) => void;
    deleteGroup: (groupId: number) => void;
    userEditId: number | null;
    setUserEditId: (id: number | null) => void;
    userDrafts: Record<number, { full_name: string; email: string }>;
    setUserDrafts: Dispatch<SetStateAction<Record<number, { full_name: string; email: string }>>>;
    saveUser: (userId: number) => void;
    userResetId: number | null;
    setUserResetId: (id: number | null) => void;
    resetPasswordDraft: string;
    setResetPasswordDraft: (value: string) => void;
    resetUserPasswordDirect: (userId: number) => void;
    userDeleteId: number | null;
    setUserDeleteId: (id: number | null) => void;
    deleteUser: (userId: number) => void;
    resetRequestDialogId: number | null;
    setResetRequestDialogId: (id: number | null) => void;
    newPasswords: Record<number, string>;
    setNewPasswords: Dispatch<SetStateAction<Record<number, string>>>;
    resolveReset: (requestId: number) => void;
    actionKey: string | null;
    busy: boolean;
};

export default function AdminDialogs({
    data,
    groupEditId,
    setGroupEditId,
    groupDrafts,
    setGroupDrafts,
    saveGroup,
    groupDeleteId,
    setGroupDeleteId,
    deleteGroup,
    userEditId,
    setUserEditId,
    userDrafts,
    setUserDrafts,
    saveUser,
    userResetId,
    setUserResetId,
    resetPasswordDraft,
    setResetPasswordDraft,
    resetUserPasswordDirect,
    userDeleteId,
    setUserDeleteId,
    deleteUser,
    resetRequestDialogId,
    setResetRequestDialogId,
    newPasswords,
    setNewPasswords,
    resolveReset,
    actionKey,
    busy,
}: AdminDialogsProps) {
    const teacherOptions = data.users.filter((u) => u.registration_status === "approved");
    const editingGroup = groupEditId ? data.groups.find((g) => g.id === groupEditId) : null;
    const deletingGroup = groupDeleteId ? data.groups.find((g) => g.id === groupDeleteId) : null;
    const editingUser = userEditId ? data.users.find((u) => u.id === userEditId) : null;
    const deletingUser = userDeleteId ? data.users.find((u) => u.id === userDeleteId) : null;
    const resettingUser = userResetId ? data.users.find((u) => u.id === userResetId) : null;

    return (
        <>
            <Dialog open={groupEditId !== null} onOpenChange={(open) => !open && setGroupEditId(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Редактирование группы</DialogTitle>
                        <DialogDescription>Измените название и преподавателя группы.</DialogDescription>
                    </DialogHeader>
                    {editingGroup ? (
                        <div className="flex flex-col gap-4 py-4">
                            <input
                                className="w-full border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                value={(groupDrafts[editingGroup.id] || { name: editingGroup.name, fk_user: String(editingGroup.fk_user) }).name}
                                maxLength={80}
                                onChange={(e) => setGroupDrafts((prev) => ({ ...prev, [editingGroup.id]: { ...(prev[editingGroup.id] || { name: editingGroup.name, fk_user: String(editingGroup.fk_user) }), name: e.target.value } }))}
                            />
                            <select
                                className="w-full border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                value={(groupDrafts[editingGroup.id] || { name: editingGroup.name, fk_user: String(editingGroup.fk_user) }).fk_user}
                                onChange={(e) => setGroupDrafts((prev) => ({ ...prev, [editingGroup.id]: { ...(prev[editingGroup.id] || { name: editingGroup.name, fk_user: String(editingGroup.fk_user) }), fk_user: e.target.value } }))}
                            >
                                <option value="">Выберите преподавателя</option>
                                {teacherOptions.map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                            </select>
                        </div>
                    ) : null}
                    <DialogFooter className="flex-col-reverse sm:flex-row">
                        <ActionButton
                            loading={actionKey === `save-group-${groupEditId}`}
                            disabled={busy || !groupEditId}
                            onClick={() => groupEditId && saveGroup(groupEditId)}
                            className="w-full sm:w-auto rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                        >
                            Сохранить
                        </ActionButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={groupDeleteId !== null} onOpenChange={(open) => !open && setGroupDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удаление группы</DialogTitle>
                        <DialogDescription>Удалить группу «{deletingGroup?.name || ""}»? Это удалит связанные данные посещаемости, оценок и студентов.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col-reverse sm:flex-row">
                        <ActionButton loading={actionKey === `delete-group-${groupDeleteId}`} disabled={busy || !groupDeleteId} onClick={() => groupDeleteId && deleteGroup(groupDeleteId)} className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2">Да, удалить</ActionButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={userEditId !== null} onOpenChange={(open) => !open && setUserEditId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Редактирование пользователя</DialogTitle>
                        <DialogDescription>Измените ФИО и email пользователя.</DialogDescription>
                    </DialogHeader>
                    {editingUser ? (
                        <div className="grid gap-3">
                            <input className="border border-border rounded-xl px-3 py-2 bg-background" maxLength={120} value={(userDrafts[editingUser.id] || { full_name: editingUser.full_name, email: editingUser.email }).full_name} onChange={(e) => setUserDrafts((prev) => ({ ...prev, [editingUser.id]: { ...(prev[editingUser.id] || { full_name: editingUser.full_name, email: editingUser.email }), full_name: e.target.value } }))} />
                            <input className="border border-border rounded-xl px-3 py-2 bg-background" type="email" maxLength={254} value={(userDrafts[editingUser.id] || { full_name: editingUser.full_name, email: editingUser.email }).email} onChange={(e) => setUserDrafts((prev) => ({ ...prev, [editingUser.id]: { ...(prev[editingUser.id] || { full_name: editingUser.full_name, email: editingUser.email }), email: e.target.value } }))} />
                        </div>
                    ) : null}
                    <DialogFooter className="flex-col-reverse sm:flex-row">
                        <ActionButton loading={actionKey === `save-user-${userEditId}`} disabled={busy || !userEditId} onClick={() => userEditId && saveUser(userEditId)} className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2">Сохранить</ActionButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={userResetId !== null} onOpenChange={(open) => !open && setUserResetId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Сброс пароля</DialogTitle>
                        <DialogDescription>Введите новый пароль для пользователя {resettingUser?.full_name || ""}.</DialogDescription>
                    </DialogHeader>
                    <input className="border border-border rounded-xl px-3 py-2 bg-background" type="password" minLength={8} maxLength={72} placeholder="Новый пароль (минимум 8 символов)" value={resetPasswordDraft} onChange={(e) => setResetPasswordDraft(e.target.value)} />
                    <DialogFooter className="flex-col-reverse sm:flex-row">
                        <ActionButton loading={actionKey === `direct-reset-${userResetId}`} disabled={busy || !userResetId} onClick={() => userResetId && resetUserPasswordDirect(userResetId)} className="rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-4 py-2">Обновить пароль</ActionButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={userDeleteId !== null} onOpenChange={(open) => !open && setUserDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удаление пользователя</DialogTitle>
                        <DialogDescription>Удалить пользователя «{deletingUser?.full_name || ""}»? Действие необратимо.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col-reverse sm:flex-row">
                        <ActionButton loading={actionKey === `delete-user-${userDeleteId}`} disabled={busy || !userDeleteId} onClick={() => userDeleteId && deleteUser(userDeleteId)} className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2">Да, удалить</ActionButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={resetRequestDialogId !== null} onOpenChange={(open) => !open && setResetRequestDialogId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Сброс по заявке</DialogTitle>
                        <DialogDescription>Введите новый пароль для обработки заявки.</DialogDescription>
                    </DialogHeader>
                    {resetRequestDialogId ? (
                        <input className="border border-border rounded-xl px-3 py-2 bg-background" type="password" minLength={8} maxLength={72} placeholder="Новый пароль (минимум 8 символов)" value={newPasswords[resetRequestDialogId] || ""} onChange={(e) => setNewPasswords((prev) => ({ ...prev, [resetRequestDialogId]: e.target.value }))} />
                    ) : null}
                    <DialogFooter className="flex-col-reverse sm:flex-row">
                        <ActionButton loading={actionKey === `reset-${resetRequestDialogId}`} disabled={busy || !resetRequestDialogId} onClick={() => resetRequestDialogId && resolveReset(resetRequestDialogId)} className="rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-4 py-2">Сбросить пароль</ActionButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

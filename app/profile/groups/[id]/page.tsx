"use client"
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useTransition, use, useCallback } from "react";
import {
    Loader2, Trash2,
    ArrowLeft, ShieldAlert, Save,
    Upload, FileText, Database, Download
} from "lucide-react";
import {
    Dialog, DialogTrigger, DialogContent, DialogHeader,
    DialogTitle, DialogFooter
} from "@/components/ui/Dialog";
import ErrorMessage from "@/components/NotifyAlert";
import { getSession, SessionPayload } from "@/utils/session";
import {getGroup, getUsersList} from "@/utils/handlers";
import {UpdateGroup, DeleteGroup, SaveAttendance, GetAttendance} from "@/utils/handlers";
import Link from "next/link";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel, VerticalAlign, TextRun } from "docx";
import { saveAs } from "file-saver";

interface Group { id: number; name: string; fk_user: number; }
interface UserListItem { id: number; full_name: string; }
interface Notify { message: string; type: 'success' | 'warning' | 'error' | ''; }
interface AttendanceStudent {
    number: string;
    fullName: string;
    fullDaysTotal: number;
    fullDaysSick: number;
    lessonsTotal: number;
    lessonsSick: number;
    late: number;
}
interface AttendanceTotal {
    fullDaysTotal: number;
    fullDaysSick: number;
    lessonsTotal: number;
    lessonsSick: number;
    late: number;
}

export default function MyGroup({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const groupId = resolvedParams.id;
    const router = useRouter();

    const [userData, setUserData] = useState<SessionPayload | null>(null);
    const [group, setGroup] = useState<Group | null>(null);
    const [users, setUsers] = useState<UserListItem[]>([]);

    const [attendanceStudents, setAttendanceStudents] = useState<AttendanceStudent[]>([]);
    const [attendanceTotal, setAttendanceTotal] = useState<AttendanceTotal | null>(null);

    const [notify, setNotify] = useState<Notify>({ message: '', type: '' });
    const [updateFormData, setUpdateFormData] = useState({ name: '', fk_user: '' });

    const [isPending, startTransition] = useTransition();
    const [isDragging, setIsDragging] = useState(false);


    const loadData = useCallback(async (id: string) => {
        const groupRes = await getGroup(id);
        if (!groupRes.success) return router.replace('/profile/groups');

        setGroup(groupRes.data);
        setUpdateFormData({ name: groupRes.data.name, fk_user: String(groupRes.data.fk_user) });

        const usersRes = await getUsersList();
        setUsers(usersRes.data ?? []);
    }, [router]);

    useEffect(() => {
        getSession().then(session => {
            if (!session) return router.replace('/login');
            setUserData(session);
            loadData(groupId);
        });
    }, [groupId, loadData, router]);

    useEffect(() => {
        if (attendanceStudents.length > 0) {
            const total = attendanceStudents.reduce((acc, curr) => ({
                fullDaysTotal: acc.fullDaysTotal + curr.fullDaysTotal,
                fullDaysSick: acc.fullDaysSick + curr.fullDaysSick,
                lessonsTotal: acc.lessonsTotal + curr.lessonsTotal,
                lessonsSick: acc.lessonsSick + curr.lessonsSick,
                late: acc.late + curr.late,
            }), { fullDaysTotal: 0, fullDaysSick: 0, lessonsTotal: 0, lessonsSick: 0, late: 0 });
            setAttendanceTotal(total);
        } else setAttendanceTotal(null);
    }, [attendanceStudents]);

    // Проверка прав
    const isOwner = userData?.uid === group?.fk_user;

    const exportToWord = async () => {
        if (attendanceStudents.length === 0) return;
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: `Отчет по посещаемости группы: ${group?.name || ""}`,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("ID")], rowSpan: 2, verticalAlign: VerticalAlign.CENTER }),
                                    new TableCell({ children: [new Paragraph("ФИО")], rowSpan: 2, verticalAlign: VerticalAlign.CENTER }),
                                    new TableCell({ children: [new Paragraph({ text: "Дни", alignment: AlignmentType.CENTER })], columnSpan: 2 }),
                                    new TableCell({ children: [new Paragraph({ text: "Уроки", alignment: AlignmentType.CENTER })], columnSpan: 2 }),
                                    new TableCell({ children: [new Paragraph("Опозд.")], rowSpan: 2, verticalAlign: VerticalAlign.CENTER }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("Всего")] }),
                                    new TableCell({ children: [new Paragraph("Болезнь")] }),
                                    new TableCell({ children: [new Paragraph("Всего")] }),
                                    new TableCell({ children: [new Paragraph("Болезнь")] }),
                                ],
                            }),
                            ...attendanceStudents.map(s => new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph(s.number)] }),
                                    new TableCell({ children: [new Paragraph(s.fullName)] }),
                                    new TableCell({ children: [new Paragraph(s.fullDaysTotal.toString())] }),
                                    new TableCell({ children: [new Paragraph(s.fullDaysSick.toString())] }),
                                    new TableCell({ children: [new Paragraph(s.lessonsTotal.toString())] }),
                                    new TableCell({ children: [new Paragraph(s.lessonsSick.toString())] }),
                                    new TableCell({ children: [new Paragraph(s.late.toString())] }),
                                ],
                            })),
                            ...(attendanceTotal ? [new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ИТОГО", bold: true })] })], columnSpan: 2 }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: attendanceTotal.fullDaysTotal.toString(), bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: attendanceTotal.fullDaysSick.toString(), bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: attendanceTotal.lessonsTotal.toString(), bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: attendanceTotal.lessonsSick.toString(), bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: attendanceTotal.late.toString(), bold: true })] })] }),
                                ],
                            })] : [])
                        ],
                    }),
                ],
            }],
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Отчет_${group?.name}.docx`);
    };

    const handleAttendanceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isOwner) return;

        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(event.target?.result as string, 'text/html');
            const table = doc.querySelector('table.marks');

            if (!table) return setNotify({ message: "Таблица не найдена", type: 'error' });

            const data: AttendanceStudent[] = Array.from(table.querySelectorAll('tr')).map(row => {
                const cells = Array.from(row.cells);
                if (cells.length < 7 || !/^\d+$/.test(cells[0].textContent?.trim() || '')) return null;

                return {
                    number: cells[0].textContent?.trim() || '',
                    fullName: cells[1].textContent?.trim() || '',
                    fullDaysTotal: Number(cells[2].textContent) || 0,
                    fullDaysSick: Number(cells[3].textContent) || 0,
                    lessonsTotal: Number(cells[4].textContent) || 0,
                    lessonsSick: Number(cells[5].textContent) || 0,
                    late: Number(cells[6].textContent) || 0,
                };
            }).filter(Boolean) as AttendanceStudent[];
            setAttendanceStudents(data);
        };
        reader.readAsText(file);
    };

    const updateAttendanceField = (index: number, field: keyof AttendanceStudent, value: any) => {
        if (!isOwner) return;
        const updated = [...attendanceStudents];
        updated[index] = { ...updated[index], [field]: (field === 'fullName' || field === 'number') ? value : (parseInt(value) || 0) };
        setAttendanceStudents(updated);
    };

    const handleLoadFromDB = async () => {
        const result = await GetAttendance(groupId);
        if (result.success && result.data.length > 0) {
            setAttendanceStudents(result.data);
            setNotify({ message: "Данные загружены", type: 'success' });
        } else {
            setNotify({ message: "Данные отсутствуют", type: 'warning' });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isOwner) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (!isOwner) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const mockEvent = {
                target: { files: files }
            } as unknown as React.ChangeEvent<HTMLInputElement>;

            handleAttendanceFileUpload(mockEvent);
        }
    };

    if (!group) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="w-full space-y-6 max-w-7xl mx-auto pb-10">
            {notify.message && <ErrorMessage message={notify.message} type={notify.type} onClose={() => setNotify({ message: '', type: '' })} />}

            <div className="bg-white dark:bg-zinc-800 py-4 px-2 rounded-lg border border-gray-100 dark:border-zinc-700 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center gap-5 w-full md:w-auto">
                        <Link href="/profile/groups" className="p-3 bg-gray-50 dark:bg-zinc-900 text-gray-400 rounded-lg border border-transparent hover:bg-blue-500 hover:text-white transition-all">
                            <ArrowLeft size={22} />
                        </Link>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">Название группы</label>
                            <div className="relative group max-w-sm">
                                <input
                                    disabled={!isOwner}
                                    value={updateFormData.name}
                                    onChange={e => setUpdateFormData({...updateFormData, name: e.target.value})}
                                    className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 outline-none w-full pb-1 transition-all disabled:opacity-80"
                                />
                                <div className="flex justify-between items-center xl:items-start gap-2 mt-2">
                                    <div className='flex gap-2'>
                                        {isOwner && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-blue-600 text-white rounded shadow-sm">
                                            Ваша группа
                                        </span>
                                        )}

                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-gray-100 dark:bg-zinc-700 rounded text-gray-500">
                                            ID: {group.id}
                                        </span>
                                    </div>
                                </div>
                                {isOwner && (
                                    <button onClick={() => startTransition(async () => { await UpdateGroup(groupId, updateFormData); setNotify({message: "Сохранено", type: 'success'}); loadData(groupId); })} className="absolute right-0 top-1 text-blue-600 hover:scale-110 transition-all">
                                        {isPending ? <Loader2 className="animate-spin" size={18}/> : <Save size={20}/>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {isOwner && (
                        <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="flex-1 md:flex-none flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-600 rounded-lg font-semibold text-sm hover:bg-amber-500 hover:text-white transition-colors">
                                        <ShieldAlert size={18}/> Передать
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Передать права</DialogTitle></DialogHeader>
                                    <select className="w-full p-3 mt-4 rounded-lg border dark:bg-zinc-900 outline-none" value={updateFormData.fk_user} onChange={e => setUpdateFormData({...updateFormData, fk_user: e.target.value})}>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                    </select>
                                    <DialogFooter><button onClick={() => startTransition(async () => { await UpdateGroup(groupId, updateFormData); router.push('/profile/groups'); })} className="w-full bg-amber-600 text-white py-3 rounded-lg font-bold">Подтвердить</button></DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <button onClick={() => {if(confirm("Удалить?")) DeleteGroup(groupId).then(() => router.push('/profile/groups'))}} className="flex-1 md:flex-none flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg font-semibold text-sm transition-colors">
                                <Trash2 size={18}/> Удалить
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-zinc-700 shadow-sm p-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><FileText size={20}/></div>
                        <h2 className="text-lg font-bold">Ведомость посещаемости</h2>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {attendanceStudents.length > 0 ? (
                            <>
                                <button onClick={exportToWord} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-600 hover:text-white transition-all">
                                    <Download size={16}/> Word
                                </button>
                                {isOwner && (
                                    <>
                                        <button onClick={() => SaveAttendance(groupId, attendanceStudents).then(() => setNotify({message: "Сохранено", type: "success"}))} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-500 font-semibold rounded-lg text-sm  hover:bg-green-500 hover:text-white transition-all">
                                            <Database size={16}/> В базу
                                        </button>
                                        <button onClick={() => setAttendanceStudents([])} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                                            <Trash2 size={18}/>
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <button onClick={handleLoadFromDB} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all">
                                <Database size={16}/> Загрузить из БД
                            </button>
                        )}
                    </div>
                </div>

                {attendanceStudents.length === 0 ? (
                    isOwner ? (
                        <label
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl cursor-pointer transition-all group ${
                                isDragging
                                    ? "border-purple-500 bg-purple-50/50"
                                    : "border-gray-100 dark:border-zinc-700 hover:bg-purple-50/20"
                            }`}
                        >
                            <Upload
                                className={`${isDragging ? "text-purple-500 scale-110" : "text-gray-300 group-hover:text-purple-500"} transition-all mb-4`}
                                size={40}
                            />
                            <span className="text-sm font-medium text-gray-500">
                                {isDragging ? "Отпустите файл здесь" : "Загрузить отчет из Дневник.ру или перетащите файл"}
                            </span>
                            <input
                                type="file"
                                className="hidden"
                                accept=".xls, .xlsx, text/html"
                                onChange={handleAttendanceFileUpload}
                            />
                        </label>
                    ) : (
                        <div className="py-20 text-center text-gray-400">Нет данных для отображения</div>
                    )
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-zinc-700">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-gray-50/50 dark:bg-zinc-900/50 text-[10px] font-bold uppercase text-gray-400">
                            <tr className="divide-x divide-gray-100 dark:divide-zinc-700 border-b dark:border-zinc-700">
                                <th rowSpan={2} className="px-2 py-4 w-10 text-center">ID</th>
                                <th rowSpan={2} className="px-4 py-4 text-left">ФИО</th>
                                <th colSpan={2} className="px-2 py-2 bg-gray-100/30 text-center border-b dark:border-zinc-700">Дни</th>
                                <th colSpan={2} className="px-2 py-2 text-center border-b dark:border-zinc-700">Уроки</th>
                                <th rowSpan={2} className="px-2 py-4 bg-red-50/30">Опозд.</th>
                            </tr>
                            <tr className="divide-x divide-gray-100 dark:divide-zinc-700 border-b dark:border-zinc-700">
                                <th className="px-2 py-2 bg-gray-100/30 text-center">Всего</th>
                                <th className="px-2 py-2 bg-gray-100/30 text-center text-amber-600">Болезнь</th>
                                <th className="px-2 py-2 text-center">Всего</th>
                                <th className="px-2 py-2 text-center text-amber-600">Болезнь</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-zinc-700">
                            {attendanceStudents.map((s, i) => (
                                <tr key={i} className="divide-x divide-gray-50 dark:divide-zinc-700 hover:bg-blue-50/10 transition-colors">
                                    <td className="px-2 py-3 text-center text-gray-300 font-mono text-[10px]">{s.number}</td>
                                    <td className="font-medium px-2 py-1 hover:bg-gray-100">
                                        <input disabled={!isOwner} value={s.fullName} onChange={e => updateAttendanceField(i, 'fullName', e.target.value)} className="w-full bg-transparent outline-none focus:text-blue-600 disabled:text-gray-700 dark:disabled:text-gray-300" />
                                    </td>
                                    <td className="px-2 py-3 bg-gray-50/20 hover:bg-gray-100">
                                        <input disabled={!isOwner} min={0} type="number" value={s.fullDaysTotal} onChange={e => updateAttendanceField(i, 'fullDaysTotal', e.target.value)} className="w-full bg-transparent outline-none text-center disabled:opacity-70" />
                                    </td>
                                    <td className="px-2 py-3 bg-gray-50/20 font-bold text-amber-600 hover:bg-gray-100">
                                        <input disabled={!isOwner} min={0} type="number" value={s.fullDaysSick} onChange={e => updateAttendanceField(i, 'fullDaysSick', e.target.value)} className="w-full bg-transparent outline-none text-center disabled:opacity-70" />
                                    </td>
                                    <td className="px-2 py-3 hover:bg-gray-100">
                                        <input disabled={!isOwner} min={0} type="number" value={s.lessonsTotal} onChange={e => updateAttendanceField(i, 'lessonsTotal', e.target.value)} className="w-full bg-transparent outline-none text-center disabled:opacity-70"/>
                                    </td>
                                    <td className="px-2 py-3 font-bold text-amber-600 hover:bg-gray-100">
                                        <input disabled={!isOwner} min={0} type="number" value={s.lessonsSick} onChange={e => updateAttendanceField(i, 'lessonsSick', e.target.value)} className="w-full bg-transparent outline-none text-center disabled:opacity-70"/>
                                    </td>
                                    <td className="px-2 py-3 bg-red-50/10 font-bold text-red-600 hover:bg-gray-100">
                                        <input disabled={!isOwner} min={0} type="number" value={s.late} onChange={e => updateAttendanceField(i, 'late', e.target.value)} className="w-full bg-transparent outline-none text-center disabled:opacity-70" />
                                    </td>
                                </tr>
                            ))}
                            {attendanceTotal && (
                                <tr className="divide-x divide-gray-100 bg-gray-50 dark:bg-zinc-900 font-bold border-t-2">
                                    <td colSpan={2} className="px-4 py-4 text-[11px] uppercase text-gray-400">Итого:</td>
                                    <td className="px-2 py-4 text-center">{attendanceTotal.fullDaysTotal}</td>
                                    <td className="px-2 py-4 text-center text-amber-600">{attendanceTotal.fullDaysSick}</td>
                                    <td className="px-2 py-4 text-center">{attendanceTotal.lessonsTotal}</td>
                                    <td className="px-2 py-4 text-center text-amber-600">{attendanceTotal.lessonsSick}</td>
                                    <td className="px-2 py-4 text-center bg-red-50 text-red-600">{attendanceTotal.late}</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
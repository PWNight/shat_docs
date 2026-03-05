import {GroupFormState} from "@/utils/definitions";

export interface AttendanceStudent {
    number: string;
    fullName: string;
    fullDaysTotal: number;
    fullDaysSick: number;
    lessonsTotal: number;
    lessonsSick: number;
    late: number;
}
export interface AttendanceTotal {
    fullDaysTotal: number;
    fullDaysSick: number;
    lessonsTotal: number;
    lessonsSick: number;
    late: number;
}
export interface SubjectGrade {
    name: string;
    grade: string;
}
export interface GradeStudent {
    fullName: string;
    subjects: SubjectGrade[];
    averageScore: number;
}
export interface Group {
    id: number;
    name: string;
    fk_user: number;
    leader: string;
    created_by: string;
}
export interface CreateFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    dispatch: (payload: FormData) => void;
    pending: boolean;
    state: GroupFormState | undefined;
    userData: { uid?: string };
}
export interface Notify {
    message: string;
    type: 'success' | 'warning' | 'error' | '';
}
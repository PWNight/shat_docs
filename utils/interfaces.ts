import {GroupFormState} from "@/utils/definitions";
import React from "react";

// Period Constants
export const MONTH_NAMES = {
    1: "Январь",
    2: "Февраль",
    3: "Март",
    4: "Апрель",
    5: "Май",
    6: "Июнь",
    7: "Июль",
    8: "Август",
    9: "Сентябрь",
    10: "Октябрь",
    11: "Ноябрь",
    12: "Декабрь",
} as const;

export const SEMESTER_NAMES = {
    1: "Первое полугодие",
    2: "Второе полугодие",
} as const;

export type MonthNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type SemesterNumber = 1 | 2;

export interface AttendanceStudent {
    number: string;
    fullName: string;
    fullDaysTotal: number;
    fullDaysSick: number;
    lessonsTotal: number;
    lessonsSick: number;
    late: number;
    periodMonth?: number;
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
    periodSemester?: number;
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
    userData: { email: string; uid: number; };
}
export interface Notify {
    message: string;
    type: 'success' | 'warning' | 'error' | '';
}

export interface UserProfile {
    id: string | number;
    full_name: string;
    email: string;
    created_by?: string | null;
    canAccessAdmin?: number;
    isRoot?: number;
}

export interface Student {
    id: number;
    full_name: string;
    fk_group: number;
}

export interface TeacherStats {
    students: number;
    avgGrade: number | string;
    attendance: {
        percent: number;
        late: number;
    };
}

export interface UpdateProfileFormData {
    full_name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    [key: string]: string | undefined;
}

export interface StatCardProps {
    icon: React.ReactElement<{
        size?: number | string;
        strokeWidth?: number;
    }>;
    label: string;
    value: string | number;
    color: string;
    bgColor: string;
    borderColor: string;
}

export interface InfoItemProps {
    label: string;
    value: string | number | null | undefined;
    icon: React.ReactElement<{
        size?: number | string;
        strokeWidth?: number;
    }>;
    iconColor: string;
    bgColor: string;
}

export interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    label: string;
}

export interface ProfileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export interface SubmitButtonProps {
    pending: boolean;
    color?: string;
}

export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data?: T;
    message?: string;
}

export interface ApiErrorResponse {
    success: false;
    message: string;
    code?: string;
    fieldErrors?: Record<string, string[]>;
}
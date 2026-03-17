import {GroupFormState} from "@/utils/definitions";
import React from "react";

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
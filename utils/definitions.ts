import { z } from 'zod'

export const LoginFormSchema = z.object({
  email: z
    .email("Введите корректную почту")
    .trim(),
  password: z
    .string()
    .min(8, { message: 'Минимальная длина пароля - 8 символов' })
    .trim(),
})

export const RegisterFormSchema = z.object({
    email: z
        .email("Введите корректную почту")
        .trim(),
    full_name: z
        .string()
        .min(1, {message: "Это поле обязательно"})
        .trim(),
    password: z
        .string()
        .min(8, { message: 'Минимальная длина пароля - 8 символов' })
        .regex(/[A-Z]/, { message: 'Пароль должен содержать хотя бы одну заглавную букву' })
        .regex(/[a-z]/, { message: 'Пароль должен содержать хотя бы одну строчную букву' })
        .regex(/[0-9]/, { message: 'Пароль должен содержать хотя бы одну цифру' })
        .regex(/[^A-Za-z0-9]/, { message: 'Пароль должен содержать хотя бы один специальный символ' })
        .trim(),
})

export const SessionFormSchema = z.object({
    uid: z
        .number(),
    email: z
        .email("Введите корректную почту")
        .trim(),
    full_name: z
        .string()
        .trim(),
})

export const GroupFormSchema = z.object({
    name: z
        .string()
        .trim(),
    fk_user: z
        .string(),
})

export const StudentFormSchema = z.object({
    full_name: z
        .string()
        .trim()
        .min(1, { message: 'ФИО не может быть пустым' }),
    fk_group: z
        .string(),
})

export type LoginFormState = {
    success?: boolean;
    message?: string;
    fieldErrors?: Record<string, string | string[]>;
    values?: {
        email: string;
        password?: string;
    };
};

export type RegisterFormState = {
    success?: boolean;
    requiresApproval?: boolean;
    message?: string;
    fieldErrors?: Record<string, string | string[]>;
    values?: {
        email: string;
        password?: string;
        full_name?: string;
    };
};

export type GroupFormState =
    | {
    fieldErrors?: {
        name?: string[]
        fk_user?: string[]
    }
    message?: string
    success?: boolean
}
    | undefined
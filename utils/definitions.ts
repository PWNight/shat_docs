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
        .trim(),
    password: z
        .string()
        .min(8, { message: 'Минимальная длина пароля - 8 символов' })
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

export type LoginFormState =
  | {
    fieldErrors?: {
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined

export type RegisterFormState =
    | {
    fieldErrors?: {
        email?: string[]
        full_name?: string[]
        password?: string[]
    }
    message?: string
}
    | undefined

export type GroupFormState =
    | {
    fieldErrors?: {
        name?: string[]
        fk_user?: string[]
    }
    message?: string
}
    | undefined

export type StudentFormState = {
    fieldErrors?: {
        full_name?: string[];
        fk_group?: string[];
    };
    message?: string;
} | undefined;
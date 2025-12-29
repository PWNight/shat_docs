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

export const SessionFormSchema = z.object({
    uid: z
        .number(),
    email: z
        .email()
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
        .trim(),
    admission_year: z
        .number()
        .min(4, { message: 'Минимальная длина - 4 символа' }),
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

export type GroupFormState =
    | {
    fieldErrors?: {
        name?: string[]
        fk_user?: string[]
    }
    message?: string
}
    | undefined
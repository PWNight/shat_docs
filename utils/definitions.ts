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

export type LoginFormState =
  | {
      errors?: {
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined

export type GroupFormState =
    | {
    errors?: {
        name?: string[]
        fk_user?: string[]
    }
    message?: string
}
    | undefined
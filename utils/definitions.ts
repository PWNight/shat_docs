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
        .int(),
    email: z
        .email()
        .trim(),
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
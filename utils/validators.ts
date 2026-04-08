import { z } from "zod";

// Схема для проверки, является ли значение положительным целым числом
const positiveInt = z.coerce.number().int().positive();

// Функция для проверки, является ли значение положительным целым числом
export function isValidEntityId(value: unknown): boolean {
    // Возвращаем true, если значение является положительным целым числом
    return positiveInt.safeParse(value).success;
}

// Функция для проверки, является ли значение месяцем
export function isValidMonth(value: unknown): boolean {
    // Создаем схема для проверки, является ли значение месяцем
    const monthSchema = z.coerce.number().int().min(1).max(12);
    // Возвращаем true, если значение является месяцем
    return monthSchema.safeParse(value).success;
}

// Функция для проверки, является ли значение семестром
export function isValidSemester(value: unknown): boolean {
    // Создаем схема для проверки, является ли значение семестром
    const semesterSchema = z.coerce.number().int().min(1).max(2);
    return semesterSchema.safeParse(value).success;
}

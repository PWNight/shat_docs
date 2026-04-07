import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();

export function isValidEntityId(value: unknown): boolean {
    return positiveInt.safeParse(value).success;
}

export function isValidMonth(value: unknown): boolean {
    const monthSchema = z.coerce.number().int().min(1).max(12);
    return monthSchema.safeParse(value).success;
}

export function isValidSemester(value: unknown): boolean {
    const semesterSchema = z.coerce.number().int().min(1).max(2);
    return semesterSchema.safeParse(value).success;
}

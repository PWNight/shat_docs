import { describe, expect, it } from "vitest";
import { isStrongPassword, isValidEmail, normalizeWhitespace, isAdminPassword } from "@/utils/validation";
import { INVALID_CREDENTIALS_MESSAGE } from "@/utils/auth-messages";
import { LoginFormSchema, RegisterFormSchema } from "@/utils/validation";

describe("validation", () => {
    it("validates email format", () => {
        expect(isValidEmail("user@example.com")).toBe(true);
        expect(isValidEmail("invalid")).toBe(false);
        expect(isValidEmail("")).toBe(false);
        expect(isValidEmail("user@")).toBe(false);
        expect(isValidEmail("@domain.com")).toBe(false);
        expect(isValidEmail("user@domain")).toBe(false);
    });

    it("validates strong password rules", () => {
        expect(isStrongPassword("Weak1!")).toBe(false);
        expect(isStrongPassword("Strong1!pass")).toBe(true);
        expect(isStrongPassword("alllowercase1!")).toBe(false);
        expect(isStrongPassword("ALLUPPERCASE1!")).toBe(false);
        expect(isStrongPassword("NoDigits!pass")).toBe(false);
        expect(isStrongPassword("NoSpecial1pass")).toBe(false);
        expect(isStrongPassword("Ab1!")).toBe(false);
        expect(isStrongPassword("ValidPass1!")).toBe(true);
    });

    it("normalizes whitespace", () => {
        expect(normalizeWhitespace("  Ivan   Petrov ")).toBe("Ivan Petrov");
        expect(normalizeWhitespace("single")).toBe("single");
        expect(normalizeWhitespace("   ")).toBe("");
        expect(normalizeWhitespace("  a   b   c  ")).toBe("a b c");
    });

    it("isAdminPassword uses same rules as isStrongPassword", () => {
        expect(isAdminPassword("Weak1!")).toBe(false);
        expect(isAdminPassword("Strong1!pass")).toBe(true);
        expect(isAdminPassword("alllowercase1!")).toBe(false);
    });
});

describe("auth messages", () => {
    it("uses neutral invalid credentials message", () => {
        expect(INVALID_CREDENTIALS_MESSAGE).toBe("Неверный email или пароль");
    });
});

describe("LoginFormSchema", () => {
    it("accepts valid login data", () => {
        const result = LoginFormSchema.safeParse({ email: "user@example.com", password: "password123" });
        expect(result.success).toBe(true);
    });

    it("rejects empty email", () => {
        const result = LoginFormSchema.safeParse({ email: "", password: "password123" });
        expect(result.success).toBe(false);
    });

    it("rejects short password", () => {
        const result = LoginFormSchema.safeParse({ email: "user@example.com", password: "short" });
        expect(result.success).toBe(false);
    });
});

describe("RegisterFormSchema", () => {
    it("accepts valid registration data", () => {
        const result = RegisterFormSchema.safeParse({
            email: "user@example.com",
            full_name: "Ivan Petrov",
            password: "StrongP@ss1"
        });
        expect(result.success).toBe(true);
    });

    it("rejects password without uppercase", () => {
        const result = RegisterFormSchema.safeParse({
            email: "user@example.com",
            full_name: "Ivan Petrov",
            password: "weakp@ss1"
        });
        expect(result.success).toBe(false);
    });

    it("rejects password without special character", () => {
        const result = RegisterFormSchema.safeParse({
            email: "user@example.com",
            full_name: "Ivan Petrov",
            password: "StrongPass1"
        });
        expect(result.success).toBe(false);
    });

    it("rejects password without digit", () => {
        const result = RegisterFormSchema.safeParse({
            email: "user@example.com",
            full_name: "Ivan Petrov",
            password: "StrongP@ss"
        });
        expect(result.success).toBe(false);
    });

    it("rejects empty full_name", () => {
        const result = RegisterFormSchema.safeParse({
            email: "user@example.com",
            full_name: "",
            password: "StrongP@ss1"
        });
        expect(result.success).toBe(false);
    });
});

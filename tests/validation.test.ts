import { describe, expect, it } from "vitest";
import { isStrongPassword, isValidEmail, normalizeWhitespace } from "@/utils/validation";
import { INVALID_CREDENTIALS_MESSAGE } from "@/utils/auth-messages";

describe("validation", () => {
    it("validates email format", () => {
        expect(isValidEmail("user@example.com")).toBe(true);
        expect(isValidEmail("invalid")).toBe(false);
    });

    it("validates strong password rules", () => {
        expect(isStrongPassword("Weak1!")).toBe(false);
        expect(isStrongPassword("Strong1!pass")).toBe(true);
    });

    it("normalizes whitespace", () => {
        expect(normalizeWhitespace("  Ivan   Petrov ")).toBe("Ivan Petrov");
    });
});

describe("auth messages", () => {
    it("uses neutral invalid credentials message", () => {
        expect(INVALID_CREDENTIALS_MESSAGE).toBe("Неверный email или пароль");
    });
});

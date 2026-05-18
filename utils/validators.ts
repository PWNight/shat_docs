// Backward compatibility re-exports
// All validation utilities are now in utils/validation.ts

export {
    LoginFormSchema,
    RegisterFormSchema,
    SessionFormSchema,
    GroupFormSchema,
    StudentFormSchema,
    isValidEntityId,
    isValidMonth,
    isValidSemester,
    EMAIL_RE,
    isValidEmail,
    normalizeWhitespace,
    isStrongPassword,
    isAdminPassword,
    type LoginFormState,
    type RegisterFormState,
    type GroupFormState,
} from "./validation";

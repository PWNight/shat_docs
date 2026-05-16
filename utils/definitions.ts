// Backward compatibility re-exports
// All validation schemas and types are now in utils/validation.ts

export {
    LoginFormSchema,
    RegisterFormSchema,
    SessionFormSchema,
    GroupFormSchema,
    StudentFormSchema,
    type LoginFormState,
    type RegisterFormState,
    type GroupFormState,
} from "./validation";

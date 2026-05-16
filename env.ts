import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),
  SESSION_EXPIRY_DAYS: z.string().default("7"),
  SQLITE_PATH: z.string().optional(),
  ROOT_EMAIL: z.string().email().optional(),
  ROOT_NAME: z.string().min(1).optional(),
  ROOT_PASSWORD: z.string().min(1).optional(),
  APP_VERSION: z.string().default("1.0.0"),
});

// Validate environment variables
const validateEnv = () => {
  const env = envSchema.safeParse(process.env);

  if (!env.success) {
    console.error("❌ Invalid environment variables:");
    env.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    });
    throw new Error("Environment validation failed");
  }

  // Additional validation for production
  if (env.data.NODE_ENV === "production") {
    if (!env.data.ROOT_EMAIL || !env.data.ROOT_NAME || !env.data.ROOT_PASSWORD) {
      console.error("❌ Missing required production environment variables:");
      if (!env.data.ROOT_EMAIL) console.error("  - ROOT_EMAIL is required in production");
      if (!env.data.ROOT_NAME) console.error("  - ROOT_NAME is required in production");
      if (!env.data.ROOT_PASSWORD) console.error("  - ROOT_PASSWORD is required in production");
      throw new Error("Missing required production environment variables");
    }
  }

  return env.data;
};

export const env = validateEnv();

// Type-safe access to environment variables
export type Env = z.infer<typeof envSchema>;

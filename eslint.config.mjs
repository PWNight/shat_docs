import { defineConfig } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    // Глобальные игноры для проекта
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts"
    ],
  },
  // Подключаем рекомендуемые правила TypeScript
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Подключаем правила Next.js напрямую из плагина
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": "error",
    },
  },
]);
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  { ignores: ["dist/**", "node_modules/**", "coverage/**"] },

  js.configs.recommended,

  // TypeScript (type-aware rules)
  ...tseslint.configs.recommendedTypeChecked,

  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // React hooks best practices
      ...reactHooks.configs.recommended.rules,

      // Vite React refresh safety
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
]);
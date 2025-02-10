import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["src/**/*.{ts}"],
    ignores: ["src/test/**"],
    languageOptions: {
      globals: globals.browser,
    },
    ...tseslint.configs.recommended,
  },
];

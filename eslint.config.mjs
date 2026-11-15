import eslint from "@eslint/js";
import promise from "eslint-plugin-promise";
import tseslint from "typescript-eslint";

/** Type-aware rules only run for sources included in tsconfig.json (see include). */
const typeCheckedFiles = ["src/**/*.ts", "src/**/*.tsx", "server/**/*.ts", "test/**/*.ts"];

export default tseslint.config(
  { ignores: ["node_modules/**", "public/**", "site/assets/**", "dist/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: typeCheckedFiles,
  })),
  {
    files: typeCheckedFiles,
    plugins: {
      promise,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: false },
      ],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/require-await": "off",
      "no-async-promise-executor": "error",
      "require-await": "off",
      "promise/catch-or-return": "error",
    },
  }
);

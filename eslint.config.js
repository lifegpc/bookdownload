import { defineConfig } from "eslint/config";
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default defineConfig([
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', {
                varsIgnorePattern: '^_',
                argsIgnorePattern: '^_',
            }],
        }
    },
    {
        files: ["src/types.ts"],
        rules: {
            "@typescript-eslint/no-empty-object-type": "off",
        }
    },
]);

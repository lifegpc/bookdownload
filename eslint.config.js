import { defineConfig } from "eslint/config";
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactLint from 'eslint-plugin-react';

export default defineConfig([
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            react: reactLint,
        },
        rules: reactLint.configs.recommended.rules,
        languageOptions: {
            parserOptions: reactLint.configs.recommended.parserOptions,
        },
        settings: {
            react: {
                version: "detect",
            }
        }
    },
    {
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', {
                varsIgnorePattern: '^_',
                argsIgnorePattern: '^_',
            }],
            'react/react-in-jsx-scope': 'off',
            'react/jsx-boolean-value': 'error',
            'react/jsx-curly-brace-presence': ['error', {
                props: 'never',
                children: 'never',
            }]
        }
    },
    {
        files: ["src/types.ts"],
        rules: {
            "@typescript-eslint/no-empty-object-type": "off",
        }
    },
    {
        ignores: ['build.js'],
    }
]);

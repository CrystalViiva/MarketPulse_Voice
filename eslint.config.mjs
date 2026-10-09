import { defineConfig, globalIgnores } from 'eslint/config';
import next from 'eslint-config-next/core-web-vitals';
import ts from 'eslint-config-next/typescript';
export default defineConfig([...next,...ts,globalIgnores(['.next/**','src/generated/**','.local/**','playwright-report/**','test-results/**','next-env.d.ts']), {rules:{'react-hooks/set-state-in-effect':'off'}}]);

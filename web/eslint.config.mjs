import { defineConfig, globalIgnores } from 'eslint/config'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

let nextConfigs

try {
  // Next 16 publishes native flat-config arrays through package exports.
  const [{ default: nextVitals }, { default: nextTypeScript }] =
    await Promise.all([
      import('eslint-config-next/core-web-vitals'),
      import('eslint-config-next/typescript'),
    ])
  nextConfigs = [...nextVitals, ...nextTypeScript]
} catch {
  // The local preview can still have Next 15 modules until the next clean
  // npm install. Its config is legacy-shaped, so adapt only in that runtime.
  const { FlatCompat } = await import('@eslint/eslintrc')
  const currentDirectory = dirname(fileURLToPath(import.meta.url))
  const compat = new FlatCompat({ baseDirectory: currentDirectory })
  nextConfigs = compat.extends('next/core-web-vitals', 'next/typescript')
}

export default defineConfig([
  ...nextConfigs,
  globalIgnores([
    '.next*/**',
    'out/**',
    'build/**',
    'coverage/**',
    'game-server/dist/**',
    'next-env.d.ts',
  ]),
])

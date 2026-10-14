// File access and the error list shared by every build stage.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { z } from 'zod'

export const ROOT = fileURLToPath(new URL('../..', import.meta.url))
export const path = (...p: string[]) => join(ROOT, ...p)
export const exists = (...p: string[]) => existsSync(path(...p))
export const read = (...p: string[]) => parse(readFileSync(path(...p), 'utf8'))
// --batch=B04 checks one batch in isolation: under content/, only files named after the batch are read
// (plus the M0 exemplar), so half-written files of other batches running in parallel do not get in the way
export const BATCH = process.argv.find((a) => a.startsWith('--batch='))?.slice(8)
export const yamlFiles = (...p: string[]) =>
  exists(...p)
    ? readdirSync(path(...p))
        .filter((f) => f.endsWith('.yaml'))
        .filter((f) => !BATCH || (p[0] !== 'content' && p[1] !== 'manifests') || f.startsWith(BATCH) || f.startsWith('00-'))
        .sort()
        .map((f) => [...p, f])
    : []

// every stage appends here; the build stops before writing anything if the list is not empty
export const errors: string[] = []
export const warnings: string[] = []

export function load<T extends z.ZodType>(schema: T, data: unknown, label: string): z.infer<T>[] {
  const result = z.array(schema).safeParse(data ?? [])
  if (!result.success) {
    for (const issue of result.error.issues) errors.push(`${label}: ${issue.path.join('.')} ${issue.message}`)
    return []
  }
  return result.data
}

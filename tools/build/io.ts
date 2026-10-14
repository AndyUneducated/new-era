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
// --batch=B11 checks one batch in isolation: the files of the other batches listed in research/round.yaml
// (the ones still running in parallel) are skipped, so their half-written files do not get in the way.
// Everything already integrated is read, so a batch can cite earlier sources, people and factions.
export const BATCH = process.argv.find((a) => a.startsWith('--batch='))?.slice(8)
// Manifests are the exception: they are always read, because a batch that corrects earlier files (V01)
// cites its own new sources there; an unreadable manifest of another running batch is skipped.
const inflight: string[] = BATCH && exists('research', 'round.yaml') ? ((read('research', 'round.yaml') ?? {}).inflight ?? []) : []
export const otherInflight = (f: string) => inflight.some((b) => b !== BATCH && f.startsWith(b))
export const inflightSource = (id: string) => inflight.some((b) => b !== BATCH && id.startsWith(`${b.toLowerCase()}-`))
const skipped = (p: string[], f: string) => p[0] === 'content' && otherInflight(f)
export const yamlFiles = (...p: string[]) =>
  exists(...p)
    ? readdirSync(path(...p))
        .filter((f) => f.endsWith('.yaml'))
        .filter((f) => !skipped(p, f))
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

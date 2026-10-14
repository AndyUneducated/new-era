// Version diff for the charter and constitution reader: paragraphs aligned by longest common subsequence,
// unmatched neighbours paired by similarity, and paired paragraphs diffed character by character.

export type Seg = { op: '=' | '+' | '-'; text: string }
export type Row =
  | { kind: 'same'; text: string; renumbered?: [string, string] }
  | { kind: 'changed'; segs: Seg[]; plus: number; minus: number }
  | { kind: 'added'; text: string }
  | { kind: 'removed'; text: string }

export const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n|\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)

// 第一百二十三条 and 第三节 move when an article is inserted earlier; compared without them by default
const NUM = /^第[一二三四五六七八九十百零〇○]+[条节]\s*/
const key = (s: string, ignoreNumbers: boolean) => (ignoreNumbers ? s.replace(NUM, '') : s)

function lcs<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean): [number, number][] {
  const n = a.length
  const m = b.length
  const t = new Int32Array((n + 1) * (m + 1))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) t[i * (m + 1) + j] = eq(a[i], b[j]) ? t[(i + 1) * (m + 1) + j + 1] + 1 : Math.max(t[(i + 1) * (m + 1) + j], t[i * (m + 1) + j + 1])
  const out: [number, number][] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (eq(a[i], b[j])) {
      out.push([i, j])
      i++
      j++
    } else if (t[(i + 1) * (m + 1) + j] >= t[i * (m + 1) + j + 1]) i++
    else j++
  }
  return out
}

function bigrams(s: string) {
  const m = new Map<string, number>()
  for (let i = 0; i < s.length - 1; i++) m.set(s.slice(i, i + 2), (m.get(s.slice(i, i + 2)) ?? 0) + 1)
  return m
}
// Dice coefficient on character pairs
function similar(a: string, b: string) {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0
  const x = bigrams(a)
  const y = bigrams(b)
  let both = 0
  for (const [k, v] of x) both += Math.min(v, y.get(k) ?? 0)
  return (2 * both) / (a.length - 1 + b.length - 1)
}

export function chars(a: string, b: string): Seg[] {
  // the common head and tail first, so the table only covers the middle
  let h = 0
  while (h < a.length && h < b.length && a[h] === b[h]) h++
  let t = 0
  while (t < a.length - h && t < b.length - h && a[a.length - 1 - t] === b[b.length - 1 - t]) t++
  const am = [...a.slice(h, a.length - t)]
  const bm = [...b.slice(h, b.length - t)]
  const segs: Seg[] = []
  const push = (op: Seg['op'], text: string) => {
    if (!text) return
    const last = segs.at(-1)
    if (last?.op === op) last.text += text
    else segs.push({ op, text })
  }
  push('=', a.slice(0, h))
  if (am.length * bm.length > 2_000_000) {
    push('-', am.join(''))
    push('+', bm.join(''))
  } else {
    let i = 0
    let j = 0
    for (const [x, y] of lcs(am, bm, (p, q) => p === q)) {
      push('-', am.slice(i, x).join(''))
      push('+', bm.slice(j, y).join(''))
      push('=', am[x])
      i = x + 1
      j = y + 1
    }
    push('-', am.slice(i).join(''))
    push('+', bm.slice(j).join(''))
  }
  push('=', a.slice(a.length - t))
  // a one- or two-character island of sameness inside a rewrite reads better as part of the rewrite,
  // and each run of edits as one deletion followed by one insertion
  const out: Seg[] = []
  let del = ''
  let ins = ''
  const flush = () => {
    if (del) out.push({ op: '-', text: del })
    if (ins) out.push({ op: '+', text: ins })
    del = ins = ''
  }
  for (const [k, s] of segs.entries()) {
    const island = s.op === '=' && s.text.length <= 2 && k > 0 && k < segs.length - 1
    if (s.op === '-' || island) del += s.text
    if (s.op === '+' || island) ins += s.text
    if (s.op === '=' && !island) {
      flush()
      out.push(s)
    }
  }
  flush()
  return out
}

export function diff(A: string[], B: string[], ignoreNumbers = true): Row[] {
  const ka = A.map((s) => key(s, ignoreNumbers))
  const kb = B.map((s) => key(s, ignoreNumbers))
  const anchors = lcs(ka, kb, (x, y) => x === y)
  const rows: Row[] = []
  let i = 0
  let j = 0
  const gap = (i1: number, j1: number) => {
    // pair the unmatched paragraphs in order where they are alike, the rest are added or removed
    let jj = j
    for (let ii = i; ii < i1; ii++) {
      let best = -1
      let score = 0.45
      for (let q = jj; q < j1; q++) {
        const s = similar(ka[ii], kb[q])
        if (s > score) {
          score = s
          best = q
        }
      }
      if (best < 0) {
        rows.push({ kind: 'removed', text: A[ii] })
        continue
      }
      for (; jj < best; jj++) rows.push({ kind: 'added', text: B[jj] })
      const segs = chars(A[ii], B[best])
      rows.push({ kind: 'changed', segs, plus: segs.filter((s) => s.op === '+').reduce((n, s) => n + s.text.length, 0), minus: segs.filter((s) => s.op === '-').reduce((n, s) => n + s.text.length, 0) })
      jj = best + 1
    }
    for (; jj < j1; jj++) rows.push({ kind: 'added', text: B[jj] })
  }
  for (const [x, y] of anchors) {
    gap(x, y)
    const na = A[x].match(NUM)?.[0].trim()
    const nb = B[y].match(NUM)?.[0].trim()
    rows.push({ kind: 'same', text: B[y], renumbered: na && nb && na !== nb ? [na, nb] : undefined })
    i = x + 1
    j = y + 1
  }
  gap(A.length, B.length)
  return rows
}

const DIGITS = '〇一二三四五六七八九'

// 1–99 in Chinese numerals: 16 → 十六, 20 → 二十
export function cnNum(n: number): string {
  if (n < 10) return DIGITS[n]
  const t = Math.floor(n / 10)
  const u = n % 10
  return `${t === 1 ? '' : DIGITS[t]}十${u ? DIGITS[u] : ''}`
}

export const congressName = (n: number) => `第${cnNum(n)}届`

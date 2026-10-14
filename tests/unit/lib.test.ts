import { describe, expect, it } from 'vitest'
import { age, fmt, fy } from '../../src/lib/dates'
import { cnNum } from '../../src/lib/cn'
import { quoted, quoteMisses } from '../../src/lib/quotes'
import { chars, diff } from '../../src/lib/diff'

describe('diff', () => {
  it('marks the struck clause of the 2018 amendment', () => {
    const segs = chars('中华人民共和国主席、副主席每届任期同全国人民代表大会每届任期相同，连续任职不得超过两届。', '中华人民共和国主席、副主席每届任期同全国人民代表大会每届任期相同。')
    expect(segs.filter((s) => s.op === '-').map((s) => s.text).join('')).toBe('，连续任职不得超过两届')
    expect(segs.some((s) => s.op === '+')).toBe(false)
  })
  it('aligns paragraphs and ignores renumbered articles', () => {
    const a = ['总纲', '第一条 甲。', '第二条 乙。', '第三条 丙丙丙丙丙丙。']
    const b = ['总纲', '第一条 甲。', '第二条 新增的一条。', '第三条 乙。', '第四条 丙丙丙丙丙丙丁。']
    const rows = diff(a, b)
    expect(rows.map((r) => r.kind)).toEqual(['same', 'same', 'added', 'same', 'changed'])
    expect(rows[3]).toMatchObject({ renumbered: ['第二条', '第三条'] })
  })
})

describe('dates', () => {
  it('reads partial dates', () => {
    expect(fmt('2012-11-15')).toBe('2012年11月15日')
    expect(fmt('2012-11')).toBe('2012年11月')
    expect(fmt('2012')).toBe('2012年')
    expect(fy('2000')).toBeCloseTo(2000.54, 1)
  })
  it('counts whole years', () => {
    expect(age('1953-06-15', '2022-10-16')).toBe(69)
    expect(age('1955-07-01', '2023-06-30')).toBe(67)
    expect(age('1955-07-01', '2023-07-01')).toBe(68)
  })
})

describe('cnNum', () => {
  it('writes congress numbers', () => {
    expect([15, 16, 20, 21].map(cnNum)).toEqual(['十五', '十六', '二十', '二十一'])
  })
})

describe('quoteMisses', () => {
  const body = '他说：“发展是硬道理。”随后又说，稳定压倒一切。'
  it('accepts a verbatim quote and ellipses', () => {
    expect(quoteMisses(body, '发展是硬道理')).toEqual([])
    expect(quoteMisses(body, '发展是硬道理……稳定压倒一切。')).toEqual([])
  })
  it('reads Windows-1252 quotes served as control characters', () => {
    expect(quoteMisses('他被称为\u0093太子党\u0094成员', '他被称为“太子党”成员')).toEqual([])
  })
  it('reports what is missing', () => {
    expect(quoteMisses(body, '改革是硬道理')).toEqual(['改革是硬道理'])
  })
})

describe('quoted', () => {
  it('nests inner quotes as single quotes', () => {
    expect(quoted('“惩前毖后”，治病救人')).toBe('“‘惩前毖后’，治病救人”')
    expect(quoted('发展是硬道理')).toBe('“发展是硬道理”')
    expect(quoted('“发展是硬道理”')).toBe('“发展是硬道理”')
  })
})

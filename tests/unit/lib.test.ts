import { describe, expect, it } from 'vitest'
import { age, fmt, fy } from '../../src/lib/dates'
import { cnNum } from '../../src/lib/cn'
import { quoteMisses } from '../../src/lib/quotes'

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

import { describe, expect, it } from 'vitest'
import { age, fmt, fy } from '../../src/lib/dates'
import { cnNum } from '../../src/lib/cn'
import { quoted, quoteMisses } from '../../src/lib/quotes'
import { chars, diff, paragraphs } from '../../src/lib/diff'
import { amountIn, chargesIn, parseFall, pleasIn, sentenceIn } from '../../src/lib/caseparse'

describe('caseparse', () => {
  const zhou = [
    { date: '2014-07-29', text: '中央政治局会议听取核查情况汇报，决定立案审查', cite: 'x' },
    { date: '2014-12-05', text: '给予开除党籍处分，将涉嫌犯罪问题及线索移送司法机关', cite: 'x' },
    { date: '2015-04-03', text: '以受贿、滥用职权、故意泄露国家秘密罪向天津市第一中级人民法院提起公诉', cite: 'x' },
    { date: '2015-06-11', text: '一审宣判：受贿罪判处无期徒刑，滥用职权罪判处有期徒刑七年，故意泄露国家秘密罪判处有期徒刑四年，决定执行无期徒刑', cite: 'x' },
  ]
  it('reads the steps, charges and sentence of a fall', () => {
    const p = parseFall(zhou, 'detained')
    expect(p.steps.map((s) => s.kind)).toEqual(['probe', 'expelled', 'charged', 'sentenced'])
    expect(p.charges).toEqual(['受贿', '滥用职权', '故意泄露国家秘密'])
    expect(p).toMatchObject({ term: 'life', outcome: 'sentenced', on: '2014-07-29', expelled: '2014-12-05', sentenced: '2015-06-11' })
  })
  it('reads terms, suspended death and sums', () => {
    expect(sentenceIn('以受贿罪判处有期徒刑十四年六个月')).toEqual({ term: 'years', years: 14.5 })
    expect(sentenceIn('以受贿罪判处死刑缓期二年执行，期满减为无期徒刑后终身监禁')).toEqual({ term: 'death-life' })
    expect(sentenceIn('判处死刑，缓期二年执行')).toEqual({ term: 'death-suspended' })
    expect(amountIn('受贿罪判处死刑缓期二年执行，受贿 1.39 亿余元')).toBe(139000000)
    expect(amountIn('受贿折合 7910 万余元')).toBe(79100000)
    expect(amountIn('非法收受财物共计折合人民币1.29亿余元，其中周永康本人收受73.11万元')).toBe(129000000)
    expect(amountIn('受贿 2000 万元，并处没收个人财产 500 万元')).toBe(20000000)
    expect(chargesIn('以利用影响力受贿罪、受贿罪判处')).toEqual(['利用影响力受贿', '受贿'])
  })
  it('tells a suicide from a sentence', () => {
    expect(parseFall([{ date: '2017-11-23', text: '在家中自缢死亡', cite: 'x' }], 'dead').outcome).toBe('suicide')
  })
  it('reads a verdict that only says 决定执行', () => {
    const p = parseFall([{ date: '2018-05-08', text: '以受贿罪、滥用职权罪数罪并罚，决定执行有期徒刑十二年', cite: 'x' }], 'detained')
    expect(p).toMatchObject({ term: 'years', years: 12, outcome: 'sentenced', sentenced: '2018-05-08' })
  })
  it('reads mitigating circumstances, only for the named defendant and not where denied', () => {
    expect(pleasIn('鉴于张三有自首情节，如实供述，认罪悔罪，积极退缴全部赃款')).toEqual(['surrender', 'refund', 'plea'])
    expect(pleasIn('李四到案后不构成自首，但有立功表现')).toEqual(['merit'])
    expect(pleasIn('张三认罪认罚。李四拒不认罪，退赃', '张三')).toEqual(['plea'])
    expect(pleasIn('法院认为，被告人张三的行为构成受贿罪。鉴于其自动投案，具有自首情节。其另有立功表现', '张三')).toEqual(['surrender', 'merit'])
    expect(pleasIn('李四构成受贿罪。鉴于其具有自首情节', '张三')).toEqual([])
    expect(pleasIn('对许家印判处无期徒刑；对违法所得继续追缴，不足部分责令退赔')).toEqual([])
    const p = parseFall([{ date: '2019-01-01', text: '以受贿罪判处有期徒刑十年', cite: 'v' }], 'detained', undefined, () => '法院认为，王五具有自首情节。赵六认罪悔罪。', '王五')
    expect(p.pleas).toEqual(['surrender'])
  })
})

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
  it('reads spaced-out headings and variant zeros as the same text', () => {
    expect(paragraphs('总 纲\n\n第一章　党 员\n\n一八四０年')).toEqual(['总纲', '第一章 党员', '一八四〇年'])
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

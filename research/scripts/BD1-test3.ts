// BD1: probe official-media site search APIs -> .probe/bd1-test3.txt
import { writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const kw = '徐宝义 简历'
const out: string[] = []
const tryit = async (name: string, u: string, init?: RequestInit) => {
  try {
    const r = await fetch(u, { ...init, headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN', ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(20000) })
    const t = await r.text()
    out.push(`## ${name}\t${r.status}\t${t.length}\n${t.replace(/\s+/g, ' ').slice(0, 1500)}`)
  } catch (e) {
    out.push(`## ${name}\tERR ${(e as Error).message}`)
  }
}
await tryit('people', 'http://search.people.cn/search-platform/front/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Referer: 'http://search.people.cn/' },
  body: JSON.stringify({ key: kw, page: 1, limit: 10, hasTitle: true, hasContent: true, isFuzzy: true, type: 0, sortType: 2, startTime: 0, endTime: 0 }),
})
await tryit('xinhua', `https://so.news.cn/getNews?keyword=${encodeURIComponent(kw)}&curPage=1&sortField=0&searchFields=1&lang=cn`, { headers: { Referer: 'https://so.news.cn/' } })
await tryit('ccdi', `https://www.ccdi.gov.cn/was5/web/search?channelid=298814&searchword=${encodeURIComponent('徐宝义')}`)
await tryit('chinanews', `https://sou.chinanews.com.cn/search.do?q=${encodeURIComponent(kw)}`)
writeFileSync('.probe/bd1-test3.txt', out.join('\n\n') + '\n', 'utf8')

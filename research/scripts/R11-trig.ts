// R11 item 2: add only a trigger line to case records that lack one, keeping each file's CRLF line ends.
// node research/scripts/R11-trig.ts            (dry run: prints what would change to .probe/R11-trig.txt)
// node research/scripts/R11-trig.ts --write
import { readFileSync, writeFileSync } from 'node:fs'

const T = (kind: string, text: string, cite: string) => `  trigger: { kind: ${kind}, text: ${text}, cite: ${cite} }`
const pension = T('chain', '2006 年上海市劳动和社保局原局长祝均一违规使用社保基金案案发，牵出陈良宇等多位政商要人，他是同批被开除党籍和公职的 9 名涉案党员之一', 'e07-bbc-2007-03-02-pension-expelled')
const football1 = T('chain', '2009—2010 年足坛反赌扫黑系列案中被查，此轮打击中足协副主席谢亚龙、南勇及一批足球领导层官员被处理', 'cs2-bbc-2024-02-13-football')
const football2 = T('chain', '本轮足球领域反腐系列案中被查；财新称王登峰 2022 年 8 月被查后足球圈窝案浮出水面', 'r09-caixin-2023-02-16-wang-dengfeng')
const hengyang = T('chain', '衡阳破坏选举案（衡阳市人大选举省人大代表中的贿选案）系列案件中被追究；本站所见来源未说明该案线索来源', 'r09-people-2014-08-18-hengyang')
const chengdu = T('chain', '李春城落马后，第一财经把他列为 2014 年相继被查的李春城任成都市委书记时期 3 名市委常委、2 名市长助理之一', 'r09-yicai-2014-10-chengdu')

const add: Record<string, Record<string, string>> = {
  'content/falls/C12.yaml': {
    'jiang-renjie': T('unknown', '本站所见来源只记他 2008 年被判死刑，未说明线索来源', 'c12-wiki-jiang-renjie'),
    'xu-maiyong': T('unknown', '本站所见来源只记他 2009 年 4 月因涉嫌严重违纪接受组织调查，未说明线索来源', 'c12-wiki-xu-maiyong'),
  },
  'content/falls/R09.yaml': {
    'qin-yu': pension,
    'sun-luyi': pension,
    'han-guozhang': pension,
    'wu-hongmei': pension,
    'xie-yalong': football1,
    'nan-yong': football1,
    'yang-yimin': T('chain', '2009—2010 年足坛反赌扫黑系列案中被查，该系列案一审 2012 年 2 月宣告结束', 'r09-chinanews-2012-02-18-yang-yimin'),
    'wang-dengfeng': T('unknown', '财新称他是本轮足球领域反腐的第一枪，2022 年 8 月 30 日接受调查，未说明线索来源', 'r09-caixin-2023-02-16-wang-dengfeng'),
    'yu-hongchen': football2,
    'li-yuyi': football2,
    'liao-jiesheng': hengyang,
    'zuo-huiling': hengyang,
    'xiao-bin': T('chain', '作为换届选举纪律监督的直接责任人，在衡阳破坏选举案中被追究；本站所见来源未说明该案线索来源', 'r09-thepaper-2014-09-25-xiao-bin'),
    'su-hao': T('unknown', '官方未说明线索来源；山西省纪委称太原连续三任公安局长出问题', 'r09-chinanews-2015-04-14-taiyuan-police'),
    'wang-maoshe': T('unknown', '山西省纪委称这是它配合中央专案组查办的案件，未说明线索来源', 'r09-chinanews-2016-01-26-shanxi-five'),
    'feng-lixiang': T('unknown', '山西省纪委称这是它配合中央专案组查办的案件，未说明线索来源', 'r09-chinanews-2016-01-26-shanxi-five'),
    'dong-hongyun': T('unknown', '山西省纪委称这是它自办查处的案件，未说明线索来源', 'r09-chinanews-2016-01-26-shanxi-five'),
    'hong-fake': T('unknown', '山西省纪委称这是它自办查处的案件，未说明线索来源', 'r09-chinanews-2016-01-26-shanxi-five'),
    'ding-xuefeng': T('unknown', '被带走调查的消息 2014 年 1 月传出，官方未说明线索来源；《中国经营报》称周滨曾参与为他运作吕梁市长一职', 'r09-yicai-2014-02-ding-xuefeng'),
    'sun-ping': chengdu,
    'he-huazhang': chengdu,
    'deng-quanzhong': chengdu,
    'liu-junlin': chengdu,
    'chen-zhengming': chengdu,
    'wang-yong-jx': T('chain', '苏荣落马后，上观新闻把他列为被曝涉苏荣案的官员之一', 'r09-jfdaily-2018-09-11-su-rong-43'),
    'cheng-danfeng': T('chain', '上观新闻称苏荣落马后，程丹峰的受贿行为随之暴露', 'r09-jfdaily-2018-09-11-su-rong-43'),
    'lin-fenqiang': T('chain', '刘志军案后，2011 年 6 月他与副局长马俊飞赴京参加铁道部会议时几乎同时被中纪委带走；第一财经称他曾在刘志军授意下为丁书苗安排车皮', 'r09-yicai-2014-lin-fenqiang'),
  },
}

const write = process.argv.includes('--write')
const log: string[] = []
for (const [file, recs] of Object.entries(add)) {
  const raw = readFileSync(file, 'utf8')
  const eol = raw.includes('\r\n') ? '\r\n' : '\n'
  const lines = raw.split(eol)
  for (const [id, line] of Object.entries(recs)) {
    const start = lines.indexOf(`${id}:`)
    if (start < 0) throw new Error(`${file}: no record ${id}`)
    let end = start + 1
    while (end < lines.length && (lines[end].startsWith(' ') || lines[end] === '')) end++
    const body = lines.slice(start + 1, end)
    if (body.some((l) => l.startsWith('  trigger:'))) throw new Error(`${file}: ${id} already has a trigger`)
    const at = body.findIndex((l) => /^  (with|politics|voices|outcome):/.test(l))
    if (at < 0) throw new Error(`${file}: ${id} has nowhere to put the trigger`)
    lines.splice(start + 1 + at, 0, line)
    log.push(`${file} ${id} @${start + 1 + at + 1}`)
  }
  if (write) writeFileSync(file, lines.join(eol))
}
writeFileSync('.probe/R11-trig.txt', log.join('\n') + '\n')

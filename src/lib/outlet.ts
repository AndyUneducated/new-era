// One name per outlet for comparing who said what: manifests record the publisher as printed on the page,
// so the same outlet appears as BBC 中文 and BBC中文网, or as a reprint (思考香港（原刊联合早报）).
const OUTLETS: [RegExp, string][] = [
  [/^BBC/, 'BBC'],
  [/布鲁金斯|Brookings/, '布鲁金斯学会'],
  [/^德国之声/, '德国之声'],
  [/^美国之音/, '美国之音'],
  [/Jamestown/, '詹姆斯敦基金会'],
  [/Reuters/, '路透社'],
  [/法广|法国国际广播电台|RFI/, '法广'],
  [/^大纪元/, '大纪元'],
  [/太阳报|太陽報/, '太阳报'],
  [/^新京报|转载新京报/, '新京报'],
  [/联合早报/, '联合早报'],
  [/東方日報|^东网/, '东方日报'],
  [/环球人物/, '环球人物'],
]

export const outlet = (publisher: string) => OUTLETS.find(([re]) => re.test(publisher))?.[1] ?? publisher

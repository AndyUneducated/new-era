# FX1: fetch-web.ts reads HTML only, so the SSE bond-trustee report (a PDF) is fetched here the same way:
# sources/raw/<id>.pdf, sources/text/<id>.txt (pypdf text, hard line breaks joined into paragraphs),
# and a line in research/fetch-log.jsonl with the SHA-256 of the file.
#   python research/scripts/FX1-pdf.py
import hashlib, io, json, re, sys, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
SOURCES = {
    'fx1-sse-2021-11-18-cec-gm-change': 'http://static.sse.com.cn/disclosure/bond/announcement/corporate/c/2021-11-18/4346272014170164483368448.pdf',
}
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
NEW_PARA = re.compile(r'^(债券代码|[一二三四五六七八九十]+、|（[一二三四五六七八九十]+）|\(以下无正文\)|（以下无正文）)')

def paragraphs(text: str) -> list[str]:
    out: list[str] = []
    for line in (l.strip() for l in text.splitlines()):
        if not line:
            continue
        if out and not re.search(r'[。！？：）)]$', out[-1]) and not NEW_PARA.match(line):
            out[-1] += line
        else:
            out.append(line)
    return out

log = ROOT / 'research' / 'fetch-log.jsonl'
for sid, url in SOURCES.items():
    if len(sys.argv) > 1 and sid not in sys.argv[1:]:
        continue
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=45).read()
    (ROOT / 'sources' / 'raw' / f'{sid}.pdf').write_bytes(data)
    text = '\n'.join(p.extract_text() or '' for p in PdfReader(io.BytesIO(data)).pages)
    body = '\n\n'.join(paragraphs(text))
    (ROOT / 'sources' / 'text' / f'{sid}.txt').write_text(body + '\n', encoding='utf-8', newline='\n')
    entry = {'id': sid, 'status': 'ok', 'at': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'), 'url': url,
             'sha256': hashlib.sha256(data).hexdigest(), 'chars': len(body)}
    with log.open('a', encoding='utf-8', newline='\n') as f:
        f.write(json.dumps(entry, ensure_ascii=False) + '\n')
    print(f'OK  {sid}  {len(body)} chars')

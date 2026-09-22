/**
 * 공중화장실 CSV(cp949, 좌표 없음) → 카카오 주소 지오코딩 → data/toilets.json
 * 재실행 가능: data/geocode-cache.json 에 주소→좌표 캐시. 우선 지역(성남·송파·강남·하남) 먼저.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { requireEnv } from './env.ts';

const KEY = requireEnv('KAKAO_REST_KEY');
const FILES = ['data/raw/toilets_6110000.csv', 'data/raw/toilets_6410000.csv'];
const PRIORITY = /성남시|송파구|강남구|하남시|서초구|강동구|광주시|과천시|용인시 수지구/;
const CACHE = 'data/geocode-cache.json';
const cache: Record<string, [number, number] | null> = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

interface Toilet { id: string; name: string; addr: string; lat: number; lng: number; kind: string; diaper: boolean; diaperWhere: string; kids: boolean; open: string; openDetail: string; tel: string; owner: string; bell: boolean }
const all: Array<Omit<Toilet, 'lat' | 'lng'>> = [];
for (const f of FILES) {
  const rows = parseCsv(new TextDecoder('euc-kr').decode(readFileSync(f)));
  const hdr = rows[0]; const ix = (h: string) => hdr.indexOf(h);
  for (const r of rows.slice(1)) {
    if (r.length < hdr.length - 2) continue;
    const addr = (r[ix('소재지도로명주소')] || r[ix('소재지지번주소')] || '').trim();
    if (!addr) continue;
    const kids = ['남성용-어린이용대변기수', '남성용-어린이용소변기수', '여성용-어린이용대변기수'].some((h) => Number(r[ix(h)]) > 0);
    all.push({
      id: r[ix('관리번호')], name: r[ix('화장실명')].trim(), addr, kind: r[ix('구분명')],
      diaper: r[ix('기저귀교환대유무')] === 'Y', diaperWhere: r[ix('기저귀교환대장소')] || '', kids,
      open: r[ix('개방시간')] || '', openDetail: r[ix('개방시간상세')] || '', tel: r[ix('전화번호')] || '',
      owner: r[ix('화장실소유구분명')] || '', bell: r[ix('비상벨설치여부')] === 'Y',
    });
  }
}
all.sort((a, b) => Number(PRIORITY.test(b.addr)) - Number(PRIORITY.test(a.addr)));
console.log(`화장실 ${all.length}건, 우선지역 ${all.filter((t) => PRIORITY.test(t.addr)).length}건, 캐시 ${Object.keys(cache).length}`);

async function geocode(addr: string): Promise<[number, number] | null> {
  if (addr in cache) return cache[addr];
  const q = addr.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
  for (const ep of ['address', 'keyword']) {
    const u = new URL(`https://dapi.kakao.com/v2/local/search/${ep}.json`);
    u.searchParams.set('query', q); u.searchParams.set('size', '1');
    const res = await fetch(u, { headers: { Authorization: `KakaoAK ${KEY}` } });
    if (res.status === 429) { await new Promise((r) => setTimeout(r, 2000)); return geocode(addr); }
    if (!res.ok) { console.warn('kakao', res.status, (await res.text()).slice(0, 80)); return null; }
    const d = (await res.json()).documents?.[0];
    if (d) { cache[addr] = [Number(d.x), Number(d.y)]; return cache[addr]; }
  }
  cache[addr] = null; return null;
}

let done = 0, miss = 0; const out: Toilet[] = [];
const t0 = Date.now();
const flush = () => { writeFileSync(CACHE, JSON.stringify(cache)); writeFileSync('data/toilets.json', JSON.stringify(out)); };
const CONC = 6; let i = 0;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (i < all.length) {
    const t = all[i++];
    const p = await geocode(t.addr);
    if (p) out.push({ ...t, lng: p[0], lat: p[1] }); else miss++;
    if (++done % 200 === 0) { flush(); console.log(`${done}/${all.length} miss ${miss} ${((Date.now() - t0) / 1000) | 0}s`); }
  }
}));
flush();
console.log(`완료: ${out.length}건 좌표 확보, 실패 ${miss}, ${((Date.now() - t0) / 1000) | 0}s → data/toilets.json`);

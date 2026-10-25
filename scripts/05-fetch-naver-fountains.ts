/**
 * 네이버 지역 검색(NCP API HUB)으로 러닝 코스 주변 음수대 보강 → data/fountains-naver.json
 * 검색은 호출당 최대 5건·위치 정렬 없음 → 코스 범위 안 동(洞)마다 "<시군구> <동> 음수대" 로 나눠 호출.
 * 동 목록은 toilets.json 주소 괄호 "(수내동, …)" 에서 추출. 아리수(서울)와 30m 이내 중복은 build 단계에서 제거.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { requireEnv } from './env.ts';
const run = JSON.parse(readFileSync('data/run.json', 'utf8'));
const pts: number[][] = run.courses.flatMap((c: any) => c.coords ?? [c.spotLngLat]);
const PAD = 0.01; // ≈1km
const box = [Math.min(...pts.map((p) => p[0])) - PAD, Math.max(...pts.map((p) => p[0])) + PAD, Math.min(...pts.map((p) => p[1])) - PAD, Math.max(...pts.map((p) => p[1])) + PAD];
const inBox = (lng: number, lat: number) => lng >= box[0] && lng <= box[1] && lat >= box[2] && lat <= box[3];
const areas = new Set<string>();
for (const t of JSON.parse(readFileSync('data/toilets.json', 'utf8'))) {
  if (!inBox(t.lng, t.lat)) continue;
  const w = t.addr.split(' '), gu = w.slice(1, 3).filter((x: string) => /(시|군|구)$/.test(x)).join(' ');
  const dong = t.addr.match(/\(([^,)]+?[동읍면리가])[,)]/)?.[1] ?? w.find((x: string) => /[동읍면]$/.test(x) && !/(시|군|구)$/.test(x)); // 도로명 괄호 → 지번 주소 순
  if (gu) areas.add(gu); // 구 단위도 1회(동 검색에서 빠지는 것 보강)
  if (gu && dong) areas.add(`${gu} ${dong}`);
}
const found = new Map<string, any>();
for (const a of areas) {
  const u = new URL('https://naverapihub.apigw.ntruss.com/search/v1/local');
  u.searchParams.set('query', `${a} 음수대`); u.searchParams.set('display', '5');
  try {
    const res = await fetch(u, { headers: { 'X-NCP-APIGW-API-KEY-ID': requireEnv('NAVER_HUB_CLIENT_ID'), 'X-NCP-APIGW-API-KEY': requireEnv('NAVER_HUB_CLIENT_SECRET') }, signal: AbortSignal.timeout(15000) });
    for (const d of (await res.json()).items ?? []) {
      const name = d.title.replace(/<[^>]+>/g, ''), lng = Number(d.mapx) / 1e7, lat = Number(d.mapy) / 1e7;
      if (!/음수|식수/.test(name) || !inBox(lng, lat)) continue; // 공원 자체·운동장 등 제외
      found.set(`${lng.toFixed(5)},${lat.toFixed(5)}`, { id: `nv${lng.toFixed(5)}_${lat.toFixed(5)}`, name, where: d.category || '', addr: d.roadAddress || d.address, lat, lng });
    }
  } catch (e) { console.warn('fail', a, (e as Error).message.slice(0, 60)); }
  await new Promise((r) => setTimeout(r, 120));
}
writeFileSync('data/fountains-naver.json', JSON.stringify([...found.values()]));
console.log(`완료: 동 ${areas.size}곳 검색 → 음수대 ${found.size}건 → data/fountains-naver.json`);

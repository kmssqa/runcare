/** web/* + data/*.json → docs/care/, web-run/* + data/run.json → docs/run/ (배포용). GitHub Pages 는 docs/ 폴더를 서빙, 심볼릭 링크 불가.
 *  docs/ 루트는 runcare 저장소 공용: /care (편의시설), /run (러닝 코스, runmakers 에서 data/run.json 생성). */
import { copyFileSync, existsSync, mkdirSync, cpSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

/** 코스 경로(없으면 스팟) 300m 이내 가족화장실(기저귀교환대 또는 어린이 변기)·음수대 → run.pois + course.poi(인덱스) */
const POI_M = 300;
function withPois(run: any) {
  const toilets = JSON.parse(readFileSync('data/toilets.json', 'utf8')).filter((t: any) => t.diaper || t.kids)
    .map((t: any) => ({ k: 'family', name: t.name, sub: t.openDetail || t.open || '', lng: t.lng, lat: t.lat }));
  const M = 111320, kx = Math.cos((37.5 * Math.PI) / 180) * M; // 등장방형 근사(m)
  const load = (f: string) => existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : [];
  // 음수대: 아리수(서울 공식 위치) + 네이버 검색(경기 포함). 네이버는 아리수와 30m 이내면 중복으로 버림
  const fountains = load('data/fountains.json').map((f: any) => ({ k: 'fountain', name: `${f.name} 음수대`, sub: f.where, lng: f.lng, lat: f.lat }));
  for (const f of load('data/fountains-naver.json'))
    if (!fountains.some((a: any) => Math.hypot((a.lng - f.lng) * kx, (a.lat - f.lat) * M) < 30)) fountains.push({ k: 'fountain', name: f.name, sub: '네이버', lng: f.lng, lat: f.lat });
  const all = [...toilets, ...fountains], pois: any[] = [], idx = new Map<any, number>();
  const segDist = (p: number[], a: number[], b: number[]) => {
    const ax = (a[0] - p[0]) * kx, ay = (a[1] - p[1]) * M, bx = (b[0] - p[0]) * kx, by = (b[1] - p[1]) * M;
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    const t = l2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l2)) : 0;
    return Math.hypot(ax + t * dx, ay + t * dy);
  };
  for (const c of run.courses) {
    const line: number[][] = c.coords?.length ? c.coords : [c.spotLngLat, c.spotLngLat];
    const pad = POI_M / M * 1.5, lngs = line.map((p) => p[0]), lats = line.map((p) => p[1]);
    const box = [Math.min(...lngs) - pad * 1.3, Math.max(...lngs) + pad * 1.3, Math.min(...lats) - pad, Math.max(...lats) + pad];
    c.poi = [];
    for (const p of all) {
      if (p.lng < box[0] || p.lng > box[1] || p.lat < box[2] || p.lat > box[3]) continue;
      const pt = [p.lng, p.lat];
      let near = false;
      for (let i = 1; i < line.length && !near; i++) near = segDist(pt, line[i - 1], line[i]) <= POI_M;
      if (!near) continue;
      if (!idx.has(p)) { idx.set(p, pois.length); pois.push(p); }
      c.poi.push(idx.get(p));
    }
  }
  console.log(`  run: 코스 ${run.courses.length}개, 주변 시설 ${pois.length}곳 (가족화장실 ${pois.filter((p) => p.k === 'family').length}, 음수대 ${pois.filter((p) => p.k === 'fountain').length})`);
  return { ...run, pois };
}
mkdirSync('docs/care/data', { recursive: true });
for (const f of ['toilets.json', 'nursing.json']) copyFileSync(`data/${f}`, `docs/care/data/${f}`);
for (const f of readdirSync('web')) if (f !== 'data') cpSync(`web/${f}`, `docs/care/${f}`);
mkdirSync('docs/run/data', { recursive: true });
if (existsSync('data/run.json')) writeFileSync('docs/run/data/run.json', JSON.stringify(withPois(JSON.parse(readFileSync('data/run.json', 'utf8')))));
else console.log('  data/run.json 없음 — runmakers 에서 npm run p0:10 후 out/run.json 복사');
for (const f of readdirSync('web-run')) cpSync(`web-run/${f}`, `docs/run/${f}`);
writeFileSync('docs/index.html', `<!doctype html><meta charset="utf-8"><title>runcare</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui;margin:2rem;line-height:1.6}a{display:block;font-size:1.2rem}</style>
<h1>runcare</h1>
<a href="care/">내 주변 편의시설 — 수유실·가족화장실·개방화장실</a>
<a href="run/">러닝 코스 추천 — 집 출발 5·10·15·20km</a>
`);
writeFileSync('docs/.nojekyll', '');
console.log('→ docs/care/ + docs/run/ + docs/index.html 준비 완료');

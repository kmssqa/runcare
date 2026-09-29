/** web/* + data/*.json → docs/care/, web-run/* + data/run.json → docs/run/ (배포용). GitHub Pages 는 docs/ 폴더를 서빙, 심볼릭 링크 불가.
 *  docs/ 루트는 runcare 저장소 공용: /care (편의시설), /run (러닝 코스, runmakers 에서 data/run.json 생성). */
import { copyFileSync, existsSync, mkdirSync, cpSync, readdirSync, writeFileSync } from 'node:fs';
mkdirSync('docs/care/data', { recursive: true });
for (const f of ['toilets.json', 'nursing.json']) copyFileSync(`data/${f}`, `docs/care/data/${f}`);
for (const f of readdirSync('web')) if (f !== 'data') cpSync(`web/${f}`, `docs/care/${f}`);
mkdirSync('docs/run/data', { recursive: true });
if (existsSync('data/run.json')) copyFileSync('data/run.json', 'docs/run/data/run.json');
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

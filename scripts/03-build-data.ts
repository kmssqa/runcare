/** data/*.json → docs/data/ 복사(배포용). GitHub Pages 는 docs/ 폴더를 서빙, 심볼릭 링크 불가 */
import { copyFileSync, mkdirSync, cpSync, readdirSync } from 'node:fs';
mkdirSync('docs/data', { recursive: true });
for (const f of ['toilets.json', 'nursing.json']) copyFileSync(`data/${f}`, `docs/data/${f}`);
for (const f of readdirSync('web')) if (f !== 'data') cpSync(`web/${f}`, `docs/${f}`);
console.log('→ docs/ (web + data) 준비 완료');

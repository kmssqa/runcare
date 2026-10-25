/**
 * 서울 아리수 음수대(아리수맵 공원 음수대 레이어) → data/fountains.json
 * 비고: 아리수맵 내부 엔드포인트(POST 1회, 좌표 포함). 공식 데이터는 data.go.kr「서울특별시_공원음수대 정보」— 배포 전 교체 검토.
 * 경기도는 공개 데이터 없음(안양시만 존재) → 미수집.
 */
import { writeFileSync } from 'node:fs';
const res = await fetch('https://arisu.seoul.go.kr/arisumap/data/drinkFountainProc.jsp', {
  method: 'POST', headers: { Referer: 'https://arisu.seoul.go.kr/arisumap/park.jsp', 'User-Agent': 'Mozilla/5.0' },
  signal: AbortSignal.timeout(60000),
});
const j = JSON.parse((await res.text()).trim());
const out = (j.features as any[]).filter((f) => f.LAT && f.LNG).map((f) => ({
  id: `f${f.COT_CONTS_ID}`, name: f.COT_CONTS_NAME, where: f.COT_VALUE_03 || '', addr: f.COT_ADDR_FULL_NEW || f.COT_ADDR_FULL_OLD || '',
  lat: Number(f.LAT), lng: Number(f.LNG),
}));
writeFileSync('data/fountains.json', JSON.stringify(out));
console.log(`완료: 음수대 ${out.length}건 (원본 ${j.features.length}) → data/fountains.json`);

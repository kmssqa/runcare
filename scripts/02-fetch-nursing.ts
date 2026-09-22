/**
 * 수유시설(sooyusil.com) 내주변 검색을 격자로 호출해 서울·경기 전역 수집 → data/nursing.json
 * 비고: 공식 OPEN API(confirmApiKey)는 승인 대기 필요. 개인 용도 MVP 로 웹 엔드포인트 사용, 배포 전 공식 키로 교체.
 */
import { writeFileSync } from 'node:fs';
const BBOX = { minLat: 37.15, maxLat: 37.8, minLng: 126.6, maxLng: 127.6 };
const STEP = 0.04; // ≈4.4km. 결과 40건 상한(최대 ~8km 반경)이므로 겹치게
const rooms = new Map<string, any>();
let calls = 0;
for (let lat = BBOX.minLat; lat <= BBOX.maxLat; lat += STEP) {
  for (let lng = BBOX.minLng; lng <= BBOX.maxLng; lng += STEP) {
    calls++;
    try {
      const res = await fetch('https://www.sooyusil.com/home/searchRoomList.do', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Referer: 'https://www.sooyusil.com/home/23.htm', 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify({ searchKeyword: '(내주변검색)', roomTypeCode: '', pageNo: '1', mylat: lat.toFixed(4), mylng: lng.toFixed(4) }),
        signal: AbortSignal.timeout(20000),
      });
      const j = await res.json();
      for (const r of j.nursingRoomSearchList ?? []) if (r.gpsLat && r.gpsLong) rooms.set(r.roomNo, r);
    } catch (e) { console.warn('fail', lat.toFixed(2), lng.toFixed(2), (e as Error).message.slice(0, 60)); }
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`lat ${lat.toFixed(2)} → 누적 ${rooms.size}건 (${calls}회)`);
}
const out = [...rooms.values()].map((r) => ({
  id: `n${r.roomNo}`, name: r.roomName, addr: r.address, location: r.location || '', lat: Number(r.gpsLat), lng: Number(r.gpsLong),
  type: r.roomTypeCode === '3' ? 'family' : 'mother', typeName: r.roomTypeCode === '3' ? '가족수유실' : '모유수유·착유실',
  fatherOk: r.fatherUseYn === '1', tel: r.managerTelNo || '', zone: r.zoneName, city: r.cityName,
}));
writeFileSync('data/nursing.json', JSON.stringify(out));
console.log(`완료: 수유실 ${out.length}건, 호출 ${calls}회 → data/nursing.json`);

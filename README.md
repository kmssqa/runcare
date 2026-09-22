# nearby-care — 내 주변 수유실·가족화장실·개방화장실

현재 위치(또는 지도에서 찍은 점) 반경 1~5km 안의 시설을 3개 필터로 보여주는 정적 PWA. 서버 없음, 카카오맵 JS 키만 사용.

## 데이터
| 필터 | 출처 | 갱신 |
|---|---|---|
| 개방화장실·가족화장실 | 행정안전부 공중화장실정보 (localdata.go.kr 파일, 서울 6110000·경기 6410000) → 좌표 없음 → 카카오 주소 지오코딩 | `npm run geocode` (캐시 재사용, 약 90초) |
| 수유실 | 인구보건복지협회 수유시설(sooyusil.com) 내주변 검색을 격자 호출 | `npm run nursing` (약 2분) |

- 가족화장실 = 기저귀교환대 있음 또는 어린이용 변기 있음
- 수유실 유형: 가족수유실(3) / 모유수유·착유실(4), 아빠 이용 가능 여부
- 수유시설 공식 OPEN API(`/home/39.htm`)는 승인 대기 필요 → 배포 전 교체

## 실행
```
cp .env.example .env   # KAKAO_REST_KEY(지오코딩), KAKAO_JS_KEY(지도)
npm run geocode && npm run nursing
python3 -m http.server 8766 -d web    # 카카오 콘솔 JS 키 도메인에 http://localhost:8766 등록
```
`web/index.html` 의 appkey 는 JS 키(도메인 제한)라 노출 OK. REST 키는 스크립트에서만 쓴다.

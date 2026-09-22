# nearby-care — 내 주변 수유실·가족화장실·개방화장실

현재 위치(또는 지도에서 찍은 점) 반경 1~5km 안의 시설을 3개 필터로 보여주는 정적 PWA. 서버 없음. 지도 표시·길찾기는 네이버(NCP Maps Client ID, Web 서비스 URL 도메인 제한). 카카오 REST 키는 데이터 생성(지오코딩)에만 사용.

## 데이터
| 필터 | 출처 | 갱신 |
|---|---|---|
| 개방화장실·가족화장실 | 행정안전부 공중화장실정보 (localdata.go.kr 파일, 서울 6110000·경기 6410000) → 좌표 없음 → 카카오 주소 지오코딩 | `npm run geocode` (캐시 재사용, 약 90초) |
| 수유실 | 인구보건복지협회 수유시설(sooyusil.com) 내주변 검색을 격자 호출 | `npm run nursing` (약 2분) |

- 가족화장실 = 기저귀교환대 있음 또는 어린이용 변기 있음
- 수유실 유형: 가족수유실(3) / 모유수유·착유실(4), 아빠 이용 가능 여부
- 수유시설 공식 OPEN API(`/home/39.htm`)는 승인 대기 필요 → 배포 전 교체

## 배포 (GitHub Pages)
- 소스는 `web/`, 배포 산출물은 `docs/` (`npm run build-data` 가 web + data/*.json 을 복사). GitHub Pages 설정: Branch `main`, folder `/docs`.
- 배포 URL 을 NCP 콘솔 Maps Application 의 Web 서비스 URL 에 추가해야 지도가 뜬다 (예: `https://mskimqa.github.io`).
- NCP 는 결제수단이 등록된 종량제다. Web Dynamic Map 무료 한도를 넘으면 과금될 수 있으니 콘솔에서 **사용 한도(일/월)** 를 걸어 둔다.
- 데이터 갱신: `npm run geocode && npm run nursing && npm run build-data` 후 커밋·푸시.

## 실행
```
cp .env.example .env   # KAKAO_REST_KEY(지오코딩), NAVER_MAP_CLIENT_ID(지도)
npm run geocode && npm run nursing
npm run build-data && python3 -m http.server 8766 -d docs   # NCP Web 서비스 URL 에 http://localhost:8766 등록
```
`web/index.html` 의 ncpKeyId 는 도메인 제한이 걸린 Client ID 라 노출 OK. 카카오 REST 키는 스크립트에서만 쓴다.

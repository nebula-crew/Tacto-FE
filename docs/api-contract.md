# 백엔드 API 연동

백엔드 원본 명세는 BE 레포 `docs/API.md`(schema 0.3.x)입니다. 이 문서는 앱이 그중 무엇을 쓰는지만 적습니다.

| | 주소 |
| --- | --- |
| 배포 서버 | `https://3-107-144-61.sslip.io` |
| 로컬 서버 | `http://<PC의 LAN IP>:8000` |

`.env`의 `EXPO_PUBLIC_API_URL`에 `/api`를 뺀 주소를 넣습니다.

## 점검 요청

`POST /api/inspections`, `multipart/form-data`, 필드명 **`photo`**, 사진 한 장 (최대 15MB). 동기 API라 분석이 끝나면 200으로 결과를 돌려줍니다 (보통 3초 안팎, 서버를 켠 뒤 첫 요청은 7초 안팎).

| 상태 | 뜻 |
| --- | --- |
| 400 | 사진 없음·읽기 실패 |
| 413 | 15MB 초과 |
| 429 | 요청이 너무 많음 (IP당 분당 10회) |
| 503 | 서버에 모델이 준비되지 않음 |

## 응답 → 화면 변환 (`services/inspection-schema.ts`)

서버는 `InspectionResult`를 돌려주고, 앱은 화면용 `Inspection`으로 바꿔 씁니다.

| 화면 (`Inspection`) | 서버 (`InspectionResult`) |
| --- | --- |
| `id` | `inspection_id` |
| `status` | `overall` (`suspected` 오류 의심 · `normal` 정상 추정 · `hold` 판정 보류) |
| `summary` | 앱이 만듦: "오류 의심 N건 · 보류 M건. (첫 의심 판정 메시지)" / 정상 문구 / 첫 보류 메시지 |
| `checks[].code` | `findings[].code` |
| `checks[].title` | 코드별 화면 이름 (`CODE_TITLES`). `primary: false`면 "(보조)" |
| `checks[].status` | `findings[].verdict` |
| `checks[].detail` | `message` + "개선 방향: `suggestion`" + "근거: `clause`" |
| `not_applicable` 항목 | `scope`가 "해당 없음 / 건너뜀 / 대상 없음 (이유)"인 계열 (C·M) |

항목 순서는 의심 → 보류 → 정상 → 미적용입니다.

예전 화면 계약(`{ id, status, summary, checks }`)도 그대로 받습니다 (예시 데이터·테스트용).

## 아직 쓰지 않는 서버 기능

- `photo_url`, `findings[].location`: 저장된 사진과 사진 위 판정 위치 핀
- 위치 저장: 점검 요청에 `address`·`memo`·`lat`·`lng`를 같이 보내면 신고로 저장되어 관리자 화면에 나옵니다
- 관리자 API (`/api/admin/inspections`, `X-Admin-Token` 헤더)

4xx/5xx와 형식이 다른 응답은 실패로 표시하고, 임의의 분석 결과를 만들지 않습니다.

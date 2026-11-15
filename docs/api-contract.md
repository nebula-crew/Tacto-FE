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
| `summary` | 앱이 만듦: 의심이면 "첫 의심 판정 메시지 외 N건", 정상이면 정상 판정 메시지(이유)들을 " · "로 이음, 보류면 첫 보류 메시지 |
| `checks[].code` | `findings[].code` |
| `checks[].title` | 코드는 보여 주지 않음. 의심이면 오류 설명(`CODE_TITLES`, 예: "블록이 횡단보도 입구까지 이어지지 않아요"), 정상·보류면 "확인한 것: 문제 없어요 / 판단하지 못했어요". `primary: false`면 "(참고)" |
| `checks[].status` | `findings[].verdict` |
| `checks[].detail` | `message` + "개선 방향: `suggestion`" + "근거: `clause`" |
| `not_applicable` 항목 | `scope`가 "해당 없음 / 건너뜀 / 대상 없음 (이유)"인 계열 (C·M) |

항목 순서는 의심 → 보류 → 정상 → 미적용입니다. 정상 추정이면 정상 항목(이유)만 보여 줍니다. 같은 제목·판정 항목은 하나로 합칩니다.
서버 메시지 안의 규칙 코드 표기(예: "(C4)", "(M3 대상 불명확)")는 화면에서 지웁니다 (`plain`).

예전 화면 계약(`{ id, status, summary, checks }`)도 그대로 받습니다 (예시 데이터·테스트용).

## 신고 접수 (`app/report.tsx` → `submitReport`)

`POST /api/inspections/{inspection_id}/report`, JSON `{ "address": 발견 위치, "memo": 확인이 필요한 내용 }` (위치 200자, 내용 1000자 이내).
접수되면 관리자 신고 목록에 위치가 채워져 나옵니다. 담당자가 확인을 시작하기 전(`received`)까지는 다시 보내면 덮어씁니다.

| 상태 | 화면 안내 |
| --- | --- |
| 409 | 이미 담당자가 확인 중이라 수정 불가 |
| 404 | 점검 기록 없음 → 다시 점검 |
| 422 | 위치·내용 길이 확인 |
| 그 외 | 접수 실패, 다시 시도 |

## 아직 쓰지 않는 서버 기능

- `photo_url`, `findings[].location`: 저장된 사진과 사진 위 판정 위치 핀
- `lat`·`lng`: 현재 위치(GPS) 첨부 (`expo-location` 필요)
- 관리자 API (`/api/admin/inspections`, `X-Admin-Token` 헤더)

4xx/5xx와 형식이 다른 응답은 실패로 표시하고, 임의의 분석 결과를 만들지 않습니다.

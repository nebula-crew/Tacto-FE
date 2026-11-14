# 프론트엔드가 기대하는 API 계약

현재 백엔드 원본 스키마를 검증하지 않았습니다. 아래는 연결을 위한 제안 계약입니다. 모델 통합은 별도 작업입니다.

`POST /api/inspections`, `multipart/form-data`, 필드명 `file`, 파일 한 장(image/jpeg). Content-Type은 fetch가 boundary와 함께 자동 지정합니다. 서버는 분석 완료 후 200/201 JSON을 반환하는 동기 API로 가정합니다. 비동기 202/job_id 방식이면 별도 폴링 구현이 필요합니다.

```json
{
  "id": "inspection_001",
  "status": "suspected",
  "summary": "연결부 점형블록 주변을 확인해 주세요.",
  "checks": [
    {
      "code": "M3",
      "title": "연결부 점형블록",
      "status": "suspected",
      "detail": "현장에서 연결 지점을 확인해 주세요."
    },
    {
      "code": "H3",
      "title": "검사 대상 여부",
      "status": "not_applicable",
      "detail": "해당 검사 대상이 없습니다."
    }
  ]
}
```

전체 status: `suspected`(오류 의심), `normal`(정상 추정), `hold`(판정 보류).
항목 status는 위 세 값과 `not_applicable`(미적용)을 지원합니다.
필수 문자열: id, summary, 항목의 code/title/detail. checks는 빈 배열도 허용합니다.

항목 코드와 표시명은 서버에서 전달합니다. C5는 선형 유도 없음, C6는 선형 방향 불일치로 구분하세요. 검사 대상 없음과 판단 정보 부족은 각각 미적용/판정 보류로 구분합니다. 전체 상태 집계는 백엔드 책임입니다.

4xx/5xx는 UI에서 실패로 표시하며 임의의 분석 결과를 만들지 않습니다. 인증은 아직 추가하지 않았습니다. 운영 서비스에서는 서버 인증, 업로드 크기 제한 및 사진 처리 정책을 별도로 설계하세요.

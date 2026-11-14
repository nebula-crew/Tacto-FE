import type { Inspection, InspectionStatus } from '../types/inspection';
export function demoInspection(status: InspectionStatus): Inspection {
  return { id: 'example', status, summary: status === 'suspected' ? '연결부 주변을 현장에서 다시 확인해 주세요.' : status === 'normal' ? '사진에서 뚜렷한 오류 후보가 확인되지 않은 상황의 예시입니다.' : '사진에 필요한 주변 정보가 충분하지 않은 상황의 예시입니다.', checks: [
    { code: 'M3', title: '연결부 점형블록', status, detail: '실제 분석이 아닌 화면 확인용 예시 항목입니다.' },
    { code: 'C5', title: '선형 유도 없음', status: 'hold', detail: '횡단보도와 주변 동선 확인이 필요합니다.' },
    { code: 'C6', title: '선형 방향 불일치', status: 'hold', detail: '진행 방향을 확인할 수 있는 사진이 필요합니다.' },
    { code: 'H3', title: '검사 대상 여부', status: 'not_applicable', detail: '해당 검사 대상이 없는 경우 미적용으로 표시합니다.' },
  ] };
}

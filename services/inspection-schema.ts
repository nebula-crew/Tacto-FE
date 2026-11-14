import type { CheckStatus, Inspection, InspectionStatus } from '../types/inspection';

// 백엔드 InspectionResult(schema 0.3.x, BE 레포 docs/API.md)를 화면용 Inspection으로 바꾼다.
// 예전 화면 계약({ id, status, summary, checks })도 그대로 받는다 (예시 데이터·테스트용).

const STATUSES: InspectionStatus[] = ['suspected', 'normal', 'hold'];
const ORDER: Record<string, number> = { suspected: 0, hold: 1, normal: 2, not_applicable: 3 };

export const CODE_TITLES: Record<string, string> = {
  M3: '꺾임·분기점 점형 누락',
  M4: '선형 경로 끊김',
  C1: '횡단보도 연결 누락',
  C2: '차도 방향 유도 (위험)',
  C3: '꺾임 안내 누락',
  C4: '진입부 점형·방향 오류',
  C5: '선형 유도 없음',
  C6: '선형 방향 불일치',
  H1: '판정 보류 · 인식 신뢰도 낮음',
  H2: '판정 보류 · 시점 보정 실패',
  H3: '판정 보류 · 횡단보도가 보이지 않음',
  H4: '판정 보류 · 블록이 작게 찍힘',
};

const SCOPE_TITLES: Record<string, string> = { C: '횡단보도 연결·방향 (C 계열)', M: '블록 모양 (M 계열)' };
const NOT_APPLICABLE = ['해당 없음', '건너뜀', '대상 없음'];

type Finding = { code: string; verdict: InspectionStatus; message: string; clause?: string | null; suggestion?: string | null; primary?: boolean };

function isStatus(v: unknown): v is InspectionStatus { return typeof v === 'string' && (STATUSES as string[]).includes(v); }

function parseLegacy(v: Record<string, unknown>): Inspection {
  if (typeof v.id !== 'string' || !isStatus(v.status) || typeof v.summary !== 'string' || !Array.isArray(v.checks)) throw new Error('서버 응답 형식이 계약과 다릅니다.');
  for (const item of v.checks) {
    if (!item || typeof item !== 'object' || typeof item.code !== 'string' || typeof item.title !== 'string' || typeof item.detail !== 'string' || typeof item.status !== 'string' || ![...STATUSES, 'not_applicable'].includes(item.status)) throw new Error('점검 항목 응답 형식을 확인해 주세요.');
  }
  return v as unknown as Inspection;
}

// M·C 코드의 '보류'가 오류 이름만 보이면 오류로 읽히므로 "(판정 보류)"를 붙인다. H 코드는 이름에 이미 보류가 들어 있다.
function titleOf(f: Finding): string {
  let title = CODE_TITLES[f.code] ?? f.code;
  if (f.verdict === 'hold' && !f.code.startsWith('H')) title += ' (판정 보류)';
  else if (f.verdict === 'normal') title += ' (정상)';
  if (f.primary === false) title += ' (보조)';
  return title;
}

function detailOf(f: Finding): string {
  const lines = [f.message];
  if (f.suggestion) lines.push(`개선 방향: ${f.suggestion}`);
  if (f.clause) lines.push(`근거: ${f.clause}`);
  return lines.join('\n');
}

function summaryOf(status: InspectionStatus, findings: Finding[]): string {
  const suspected = findings.filter(f => f.verdict === 'suspected'), held = findings.filter(f => f.verdict === 'hold');
  if (status === 'suspected') {
    const first = suspected.find(f => f.primary !== false) ?? suspected[0];
    return `오류 의심 ${suspected.length}건${held.length ? ` · 보류 ${held.length}건` : ''}. ${first?.message ?? ''}`.trim();
  }
  if (status === 'normal') return '사진에서 확인한 항목에서는 설치 오류 후보가 보이지 않아요.';
  return held[0]?.message ?? '사진만으로는 판정하기 어려워요. 다시 찍어 주세요.';
}

function parseBackend(v: Record<string, unknown>): Inspection {
  if (typeof v.inspection_id !== 'string' || !isStatus(v.overall) || !Array.isArray(v.findings)) throw new Error('서버 응답 형식이 계약과 다릅니다.');
  const findings: Finding[] = [];
  for (const item of v.findings) {
    if (!item || typeof item !== 'object' || typeof item.code !== 'string' || !isStatus(item.verdict) || typeof item.message !== 'string') throw new Error('점검 항목 응답 형식을 확인해 주세요.');
    findings.push(item as Finding);
  }
  const checks: Inspection['checks'] = findings.map(f => ({
    code: f.code,
    title: titleOf(f),
    status: f.verdict as CheckStatus,
    detail: detailOf(f),
  }));
  const scope = v.scope && typeof v.scope === 'object' ? (v.scope as Record<string, unknown>) : {};
  for (const [family, text] of Object.entries(scope)) {
    if (typeof text !== 'string' || !NOT_APPLICABLE.some(p => text.startsWith(p))) continue;
    const reason = text.match(/\((.*)\)/)?.[1] ?? text;
    checks.push({ code: family, title: SCOPE_TITLES[family] ?? family, status: 'not_applicable', detail: reason });
  }
  checks.sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  return { id: v.inspection_id, status: v.overall, summary: summaryOf(v.overall, findings), checks };
}

export function parseInspection(value: unknown): Inspection {
  if (!value || typeof value !== 'object') throw new Error('서버 응답 형식을 확인해 주세요.');
  const v = value as Record<string, unknown>;
  return 'inspection_id' in v || 'findings' in v ? parseBackend(v) : parseLegacy(v);
}

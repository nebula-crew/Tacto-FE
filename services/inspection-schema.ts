import type { CheckStatus, Inspection, InspectionStatus } from '../types/inspection';

// 백엔드 InspectionResult(schema 0.3.x, BE 레포 docs/API.md)를 화면용 Inspection으로 바꾼다.
// 예전 화면 계약({ id, status, summary, checks })도 그대로 받는다 (예시 데이터·테스트용).

const STATUSES: InspectionStatus[] = ['suspected', 'normal', 'hold'];
const ORDER: Record<string, number> = { suspected: 0, hold: 1, normal: 2, not_applicable: 3 };

// 화면에는 코드(C1 등) 대신 무엇을 봤는지 쓴다. 의심일 때는 오류 이름, 정상·보류일 때는 '무엇을 확인했는지'.
export const CODE_TITLES: Record<string, string> = {
  M3: '꺾임·분기점에 점형 블록이 없어요',
  M4: '선형 블록 경로가 끊겨 있어요',
  C1: '블록이 횡단보도 입구까지 이어지지 않아요',
  C2: '블록이 차도 쪽을 가리켜요 (위험)',
  C3: '횡단보도 쪽으로 꺾는 안내가 없어요',
  C4: '횡단보도 진입부 점형·방향이 맞지 않아요',
  C5: '점형만 있고 길을 이끄는 선형 블록이 없어요',
  C6: '선형 블록 방향이 횡단보도와 어긋나요',
  H1: '블록이 잘 보이지 않아 판단하지 못했어요',
  H2: '사진 각도 때문에 방향은 판단하지 못했어요',
  H3: '횡단보도가 보이지 않아 연결은 판단하지 못했어요',
  H4: '블록이 작게 찍혀 모양은 판단하지 못했어요',
};
// 보류 이유별 다시 찍는 방법 (결과 요약에 씀)
const RETAKE: Record<string, string> = {
  H1: '그림자나 가림 없이 밝을 때 다시 찍어 주세요.',
  H2: '횡단보도 흰 줄이 4개 이상 보이게 찍으면 방향까지 확인할 수 있어요.',
  H3: '횡단보도가 같이 나오게 찍어 주세요.',
  H4: '블록이 화면을 크게 채우게 가까이 찍어 주세요.',
};
const SUBJECTS: Record<string, string> = {
  M3: '꺾임·분기점 점형', M4: '선형 블록 연결', C1: '횡단보도 입구 연결', C2: '블록이 가리키는 방향',
  C3: '횡단보도 쪽 꺾임 안내', C4: '진입부 점형·돌출선 방향', C5: '선형 블록 유도', C6: '선형 블록 방향',
};

const SCOPE_TITLES: Record<string, string> = { C: '횡단보도 연결·방향', M: '블록 모양 (꺾임·분기점)' };
const NOT_APPLICABLE = ['해당 없음', '건너뜀', '대상 없음'];

type Finding = { code: string; verdict: InspectionStatus; message: string; clause?: string | null; suggestion?: string | null; primary?: boolean };

// 서버 메시지 안의 규칙 코드 표기를 지운다. 예: "연결 판정(C1·C3·C4) 보류" → "연결 판정 보류", "(M3 대상 불명확)" 삭제
export function plain(text: string): string {
  return text.replace(/\s*\([CMH][1-6][^()]*\)/g, '').replace(/\s{2,}/g, ' ').trim();
}

function isStatus(v: unknown): v is InspectionStatus { return typeof v === 'string' && (STATUSES as string[]).includes(v); }

function parseLegacy(v: Record<string, unknown>): Inspection {
  if (typeof v.id !== 'string' || !isStatus(v.status) || typeof v.summary !== 'string' || !Array.isArray(v.checks)) throw new Error('서버 응답 형식이 계약과 다릅니다.');
  for (const item of v.checks) {
    if (!item || typeof item !== 'object' || typeof item.code !== 'string' || typeof item.title !== 'string' || typeof item.detail !== 'string' || typeof item.status !== 'string' || ![...STATUSES, 'not_applicable'].includes(item.status)) throw new Error('점검 항목 응답 형식을 확인해 주세요.');
  }
  return v as unknown as Inspection;
}

function titleOf(f: Finding): string {
  const subject = SUBJECTS[f.code];
  let title = f.verdict === 'suspected' || !subject ? (CODE_TITLES[f.code] ?? f.code)
    : f.verdict === 'normal' ? `${subject}: 문제 없어요` : `${subject}: 판단하지 못했어요`;
  if (f.primary === false) title += ' (참고)';
  return title;
}

function detailOf(f: Finding): string {
  const lines = [plain(f.message)];
  if (f.suggestion) lines.push(`이렇게 고치면 돼요: ${f.suggestion}`);
  if (f.clause) lines.push(`근거: ${f.clause}`);
  return lines.join('\n');
}

function summaryOf(status: InspectionStatus, findings: Finding[]): string {
  const suspected = findings.filter(f => f.verdict === 'suspected'), held = findings.filter(f => f.verdict === 'hold');
  if (status === 'suspected') {
    const first = suspected.find(f => f.primary !== false) ?? suspected[0];
    return `${plain(first?.message ?? '')}${suspected.length > 1 ? ` 외 ${suspected.length - 1}건` : ''}`.trim();
  }
  if (status === 'normal') {
    const reasons = [...new Set(findings.filter(f => f.verdict === 'normal').map(f => plain(f.message)))];
    return reasons.length ? reasons.join(' · ') : '사진에서 확인한 범위에서는 설치 오류가 보이지 않아요.';
  }
  const h = held.find(f => RETAKE[f.code]) ?? held[0];
  if (!h) return '사진만으로는 판단하기 어려워요. 다시 찍어 주세요.';
  return RETAKE[h.code] ? `${CODE_TITLES[h.code]}. ${RETAKE[h.code]}` : plain(h.message);
}

// 같은 제목·같은 판정이 여러 번 나오면 (예: 진입부 점형 정상 + 돌출선 방향 정상) 한 항목으로 합친다.
function merge(checks: Inspection['checks']): Inspection['checks'] {
  const out: Inspection['checks'] = [];
  for (const c of checks) {
    const same = out.find(o => o.title === c.title && o.status === c.status);
    if (same) same.detail = `${same.detail}\n${c.detail}`;
    else out.push({ ...c });
  }
  return out;
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
  // 정상 추정이면 정상인 이유만 보여 준다 (미적용 항목은 숨김)
  const shown = v.overall === 'normal' ? checks.filter(c => c.status === 'normal') : checks;
  return { id: v.inspection_id, status: v.overall, summary: summaryOf(v.overall, findings), checks: merge(shown) };
}

export function parseInspection(value: unknown): Inspection {
  if (!value || typeof value !== 'object') throw new Error('서버 응답 형식을 확인해 주세요.');
  const v = value as Record<string, unknown>;
  return 'inspection_id' in v || 'findings' in v ? parseBackend(v) : parseLegacy(v);
}

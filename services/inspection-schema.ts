import type { CheckStatus, Inspection, InspectionStatus } from '../types/inspection';

// 백엔드 InspectionResult(schema 0.3.x, BE 레포 docs/API.md)를 화면용 Inspection으로 바꾼다.
// 예전 화면 계약({ id, status, summary, checks })도 그대로 받는다 (예시 데이터·테스트용).

const STATUSES: InspectionStatus[] = ['suspected', 'normal', 'hold'];
const ORDER: Record<string, number> = { suspected: 0, hold: 1, normal: 2, not_applicable: 3 };

// 화면에는 코드(C1 등) 대신 무엇을 봤는지 쓴다. 의심일 때는 오류 이름, 정상·보류일 때는 '무엇을 확인했는지'.
export const CODE_TITLES: Record<string, string> = {
  M3: '꺾임·갈림길의 점형 블록 확인',
  M4: '선형 블록이 끊긴 곳 확인',
  C1: '횡단보도 입구까지 연결 확인',
  C2: '차도 쪽으로 향하는 안내 확인',
  C3: '횡단보도 입구 방향 안내 확인',
  C4: '입구의 점형 블록·방향 확인',
  C5: '입구까지 이어지는 선형 안내 확인',
  C6: '선형 블록의 진행 방향 확인',
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
const EXPLANATIONS: Record<string, string> = {
  M3: '선형 블록이 꺾이거나 갈라지는 곳에서 점형 블록을 확인하지 못했어요.',
  M4: '선형 블록이 이어져야 할 구간에 끊긴 부분이 있는 것으로 보여요.',
  C1: '블록 안내가 횡단보도 입구에 닿기 전에 끝나는 것으로 보여요.',
  C2: '선형 블록이 횡단보도 밖 차도 쪽으로 이어지는 것으로 보여요.',
  C3: '블록 안내가 횡단보도 입구로 이어지지 않고 옆을 지나가는 것으로 보여요.',
  C4: '횡단보도 입구의 점형 블록이나 선형 블록의 방향을 다시 확인할 필요가 있어요.',
  C5: '횡단보도 앞 점형 블록까지 이어지는 선형 안내를 확인하지 못했어요.',
  C6: '선형 블록이 안내하는 방향과 횡단보도 진행 방향이 다른 것으로 보여요.',
};
const GUIDANCE: Record<string, string> = {
  M3: '꺾이거나 갈라지는 곳에 점형 블록이 필요한지 현장에서 확인해 주세요.',
  M4: '끊긴 것으로 보이는 구간을 확인하고, 필요한 경우 선형 블록을 이어 주세요.',
  C1: '블록 안내가 횡단보도 입구까지 이어지는지 현장에서 확인해 주세요.',
  C2: '차도 쪽으로 향하는 안내를 확인하고 횡단보도 방향으로 유도되도록 살펴봐 주세요.',
  C3: '횡단보도 입구로 방향을 바꾸는 지점의 안내를 확인해 주세요.',
  C4: '입구의 점형 블록과 선형 블록 돌출선 방향을 각각 확인해 주세요.',
  C5: '입구의 점형 블록까지 선형 안내가 이어지는지 확인해 주세요.',
  C6: '선형 블록이 횡단보도 진행 방향으로 안내하는지 확인해 주세요.',
};
const LAW = '「장애인등편의법 시행규칙」 별표 1 제16호';
const BASIS: Record<string, string> = {
  M3: `${LAW}: 선형 블록이 시작·교차·굴절되는 곳에는 점형 블록을 설치하도록 정하고 있어요.`,
  M4: `${LAW}: 선형 블록은 유도 방향에 따라 이어서 설치하도록 정하고 있어요.`,
  C1: `${LAW}의 선형 블록 연속 설치 원칙을 참고해 횡단보도 입구와의 연결을 살펴봤어요.`,
  C2: `${LAW}의 선형 블록 유도 방향 원칙을 참고해 차도 쪽 진행을 살펴봤어요.`,
  C3: `${LAW}의 점형 블록 설치 위치와 선형 블록 유도 원칙을 참고했어요.`,
  C4: `${LAW}의 점형 블록 설치 위치와 선형 돌출선 방향 기준을 참고했어요.`,
  C5: `${LAW}의 선형 블록 연속 설치 원칙을 참고했어요.`,
  C6: `${LAW}의 선형 블록 유도 방향 원칙을 참고했어요.`,
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
  const lines = [f.verdict === 'suspected' ? EXPLANATIONS[f.code] ?? plain(f.message) : plain(f.message)];
  if (f.suggestion) lines.push(`개선 방향: ${GUIDANCE[f.code] ?? f.suggestion}`);
  if (f.clause) lines.push(`근거: ${BASIS[f.code] ?? f.clause}`);
  return lines.join('\n');
}

function summaryOf(status: InspectionStatus, findings: Finding[]): string {
  const suspected = findings.filter(f => f.verdict === 'suspected'), held = findings.filter(f => f.verdict === 'hold');
  if (status === 'suspected') {
    const first = suspected.find(f => f.primary !== false) ?? suspected[0];
    const main = first ? EXPLANATIONS[first.code] ?? plain(first.message) : '';
    return `${suspected.length > 1 ? main.replace(/[.!?]$/, '') + ` 외 ${suspected.length - 1}건` : main}`.trim();
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

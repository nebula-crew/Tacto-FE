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
// 사용자가 확인 기준과 사진에서의 관찰 결과를 구분해 읽을 수 있도록 한다.
// C 계열의 연결·방향 설명은 사진에서 확인하는 안내 흐름이며 법적 적합성 확정 문구가 아니다.
const RULES: Record<string, string> = {
  M3: '선형 블록이 시작되거나 교차·굴절되는 지점에는 방향 변화를 알리는 점형 블록이 있어야 해요.',
  M4: '선형 블록은 보행자를 안내하는 방향을 따라 끊기지 않고 이어져야 해요.',
  C1: '점자블록의 안내는 횡단보도 입구를 찾을 수 있도록 이어져야 해요.',
  C2: '선형 블록은 보행자를 횡단보도 밖 차도 쪽으로 안내하지 않아야 해요.',
  C3: '횡단보도 입구로 방향을 바꾸는 곳에서는 보행자가 방향 변화를 알아차릴 수 있어야 해요.',
  C4: '횡단보도 입구에서는 점형 블록으로 주의할 지점을 알리고, 선형 블록은 건너는 방향을 안내해야 해요.',
  C5: '횡단보도 앞 점형 블록까지 선형 블록의 안내가 이어져야 해요.',
  C6: '선형 블록의 돌출선은 횡단보도를 건너는 방향으로 안내해야 해요.',
};
const EXPLANATIONS: Record<string, string> = {
  M3: '사진에서 선형 블록이 꺾이거나 갈라지는 지점 주변에 점형 블록이 보이지 않아요. 길의 방향이 바뀌는 곳을 알아차리기 어려울 수 있어요. 사진에 가려졌을 가능성도 있으니 현장에서 해당 지점을 확인해 주세요.',
  M4: '사진에서 이어져야 할 선형 블록 사이에 빈 구간이 보이는 것으로 판단했어요. 안내를 따라 걷던 사람이 길을 놓칠 수 있어요. 실제로 블록이 끊겨 있는지는 현장에서 확인해 주세요.',
  C1: '사진에서는 선형 블록의 안내가 횡단보도 입구에 닿기 전에 끝나는 것으로 보여요. 보행자가 횡단보도 시작 지점을 찾기 어려울 수 있으니 연결 상태를 현장에서 살펴봐 주세요.',
  C2: '사진에서 선형 블록이 횡단보도 바깥의 차도 쪽으로 이어지는 것으로 보여요. 안내를 따라 이동할 때 위험한 방향으로 갈 수 있으니 실제 진행 방향을 현장에서 확인해 주세요.',
  C3: '사진에서는 블록 안내가 횡단보도 입구로 방향을 바꾸지 않고 옆을 지나가는 것으로 보여요. 보행자가 입구를 지나칠 수 있으니 방향 전환 지점을 확인해 주세요.',
  C4: '사진에서 횡단보도 입구의 점형 블록 위치 또는 선형 블록이 안내하는 방향을 다시 살펴볼 필요가 있어요. 두 블록이 실제로 어디를 가리키는지 현장에서 확인해 주세요.',
  C5: '사진에서 횡단보도 앞 점형 블록까지 이어지는 선형 블록을 확인하지 못했어요. 입구까지 안내가 이어지지 않을 수 있으니 블록 연결 상태를 현장에서 확인해 주세요.',
  C6: '사진에서는 선형 블록이 가리키는 방향과 횡단보도를 건너는 방향이 다른 것으로 보여요. 안내를 따라갔을 때 횡단보도 안쪽으로 향하는지 현장에서 확인해 주세요.',
};
const NORMAL_EXPLANATIONS: Record<string, string> = {
  M3: '사진에서 선형 블록이 꺾이거나 갈라지는 지점 주변에 점형 블록이 확인됐어요. 점형 블록은 길의 방향이 바뀌거나 갈라진다는 점을 보행자에게 알려 주는 역할을 해요. 이 사진에서 확인한 범위에서는 해당 지점의 점형 블록이 빠진 것으로 보이지 않아요.',
  M4: '사진에서 선형 블록이 걷는 방향을 따라 이어지는 모습이 확인됐어요. 확인한 구간에서는 안내가 중간에 끊긴 것으로 보이지 않아요. 사진 밖의 구간까지 확인한 결과는 아니에요.',
  C1: '사진에서 블록 안내가 횡단보도 입구까지 이어지는 모습이 확인됐어요. 확인한 범위에서는 입구에 닿기 전에 안내가 끝나는 것으로 보이지 않아요.',
  C2: '사진에서 선형 블록이 횡단보도 바깥의 차도 쪽으로 곧장 안내하는 모습은 확인되지 않았어요. 사진에 보이는 방향을 기준으로 살펴본 결과예요.',
  C3: '사진에서 블록 안내가 횡단보도 입구 쪽으로 이어지는 모습이 확인됐어요. 확인한 범위에서는 입구를 지나쳐 다른 방향으로 안내하는 것으로 보이지 않아요.',
  C5: '사진에서 횡단보도 앞 점형 블록으로 이어지는 선형 안내가 확인됐어요. 확인한 범위에서는 입구로 가는 안내가 빠진 것으로 보이지 않아요.',
  C6: '사진에서 선형 블록이 가리키는 방향과 횡단보도를 건너는 방향이 맞는 것으로 보여요. 실제 방향과 설치 상태는 현장에서도 확인할 수 있어요.',
};
const HOLD_EXPLANATIONS: Record<string, string> = {
  H1: '사진에서 점자블록의 모양이나 위치를 충분히 구분하기 어려워 이번 항목은 판단하지 못했어요. 블록이 가려지지 않도록 밝은 곳에서 선명하게 다시 찍어 주세요.',
  H2: '사진 각도 때문에 횡단보도와 블록의 진행 방향을 정확히 비교하기 어려워요. 횡단보도 흰 줄과 블록이 함께 보이도록 조금 뒤에서 다시 찍어 주세요.',
  H3: '사진에 횡단보도가 충분히 보이지 않아 블록이 입구까지 이어지는지 판단하지 못했어요. 블록과 횡단보도 시작 지점을 한 장에 담아 다시 찍어 주세요.',
  H4: '사진에서 점자블록이 너무 작게 보여 모양과 연결 상태를 구분하기 어려워요. 블록이 더 크게 보이도록 가까이에서 다시 찍되 주변 길도 함께 담아 주세요.',
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

function explanationOf(f: Finding): string {
  const rule = RULES[f.code];
  const withRule = (observation: string) => rule ? `확인 기준: ${rule}\n사진에서 확인한 내용: ${observation}` : observation;
  if (f.verdict === 'suspected') return withRule(EXPLANATIONS[f.code] ?? plain(f.message));
  if (f.verdict === 'hold') {
    if (HOLD_EXPLANATIONS[f.code]) return HOLD_EXPLANATIONS[f.code];
    const subject = SUBJECTS[f.code];
    return withRule(subject
      ? `사진만으로 ${subject} 상태를 분명하게 확인하기 어려워 이번 항목은 판단을 보류했어요. 블록과 주변 길이 함께 선명하게 보이도록 다시 찍어 주세요.`
      : plain(f.message));
  }
  if (f.code === 'C4') {
    if (/점형/.test(f.message)) return withRule('횡단보도 입구 주변의 점형 블록이 확인됐어요. 확인한 범위에서는 이 블록이 빠진 것으로 보이지 않아요.');
    if (/돌출선|방향/.test(f.message)) return withRule('입구 주변 선형 블록의 돌출선이 횡단보도 진행 방향과 맞는 것으로 보여요. 확인한 범위에서는 안내 방향이 어긋난 것으로 보이지 않아요.');
    return withRule('횡단보도 입구의 점형 블록과 선형 블록 안내를 확인했어요. 확인한 범위에서는 뚜렷한 설치 오류가 보이지 않아요.');
  }
  return withRule(NORMAL_EXPLANATIONS[f.code] ?? plain(f.message));
}

function detailOf(f: Finding): string {
  const lines = [explanationOf(f)];
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
    return '사진에서 확인한 항목에는 뚜렷한 설치 오류가 보이지 않아요. 항목별로 확인한 내용을 아래에서 살펴보세요.';
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
    if (same) {
      const extra = c.detail.split('\n').filter(line => !line.startsWith('확인 기준:') || !same.detail.includes(line));
      same.detail = [same.detail, ...extra].join('\n');
    }
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
  const status = overallOf(findings, v.overall);
  // 정상 추정이면 정상인 이유만 보여 준다 (보류·미적용 항목은 숨김)
  const shown = status === 'normal' ? checks.filter(c => c.status === 'normal') : checks;
  return { id: v.inspection_id, status, summary: summaryOf(status, findings), checks: merge(shown) };
}

// 화면에 보여 줄 종합 판정: 오류 의심이 하나라도 있으면 오류 > 정상이 하나라도 있으면 정상 > 보류만 있으면 보류.
// 예: 입구 연결 정상 + 사진 각도 때문에 방향만 보류 → 정상 추정. 판정 항목이 없으면 서버 값을 그대로 쓴다.
export function overallOf(findings: Finding[], fallback: InspectionStatus): InspectionStatus {
  if (findings.some(f => f.verdict === 'suspected')) return 'suspected';
  if (findings.some(f => f.verdict === 'normal')) return 'normal';
  if (findings.some(f => f.verdict === 'hold')) return 'hold';
  return fallback;
}

export function parseInspection(value: unknown): Inspection {
  if (!value || typeof value !== 'object') throw new Error('서버 응답 형식을 확인해 주세요.');
  const v = value as Record<string, unknown>;
  return 'inspection_id' in v || 'findings' in v ? parseBackend(v) : parseLegacy(v);
}

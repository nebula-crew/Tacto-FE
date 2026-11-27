import { API_URL } from './api';
import { parseInspection } from './inspection-schema';
import type { Inspection, InspectionStatus } from '../types/inspection';

// 관리자 화면용 API. BE docs/API.md 관리자 (X-Admin-Token 헤더). 토큰은 코드에 넣지 않고 화면에서 입력받는다.

export type ReportStatus = 'received' | 'reviewing' | 'resolved' | 'rejected';
export const REPORT_STATUSES: ReportStatus[] = ['received', 'reviewing', 'resolved', 'rejected'];
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = { received: '접수', reviewing: '확인 중', resolved: '처리 완료', rejected: '반려' };

export type Location = { address?: string | null; memo?: string | null; lat?: number | null; lng?: number | null };
export type ReportSummary = {
  inspection_id: string; created_at?: string | null; overall: InspectionStatus; status: ReportStatus;
  codes: string[]; location?: Location | null; photo_url?: string | null;
};
// 서버 판정 원본 한 줄 (관리자는 규칙 코드·조항까지 그대로 본다. 시민 앱은 inspection-schema가 쉬운 말로 바꿔 보여 줌)
export type RuleFinding = {
  code: string; verdict: 'suspected' | 'normal' | 'hold'; message: string;
  clause?: string | null; suggestion?: string | null; primary?: boolean; confidence?: number | null;
};
export type ReportDetail = ReportSummary & {
  admin_memo?: string | null; updated_at?: string | null; inspection: Inspection;
  findings: RuleFinding[]; scope: Record<string, string>;
};

// 관리자 화면용 규칙 이름 (BE pipeline/rules 기준). M = 블록 모양, C = 횡단보도 연결·방향, H = 판정 보류 사유
export const RULE_NAMES: Record<string, string> = {
  M3: '꺾임·분기점 점형 블록', M4: '선형 블록 끊김',
  C1: '횡단보도 입구까지 연결', C2: '차도 쪽으로 유도', C3: '횡단보도 쪽 꺾임 안내', C4: '입구 점형 블록·돌출선 방향',
  C5: '입구까지 선형 유도', C6: '선형 블록 진행 방향',
  H1: '블록 인식 불확실', H2: '시점 보정 실패 (방향 판정 보류)', H3: '횡단보도·차도 미확인', H4: '블록이 너무 작게 찍힘',
};
export const RULE_FAMILIES: Record<string, string> = { M: '블록 모양', C: '횡단보도 연결·방향' };
const VERDICT_ORDER = { suspected: 0, hold: 1, normal: 2 } as const;

function toFindings(result: unknown): { findings: RuleFinding[]; scope: Record<string, string> } {
  const r = (result ?? {}) as { findings?: unknown; scope?: unknown };
  const raw = Array.isArray(r.findings) ? r.findings : [];
  const findings = raw.filter((f): f is RuleFinding => !!f && typeof f === 'object' && typeof (f as RuleFinding).code === 'string'
    && typeof (f as RuleFinding).message === 'string' && (f as RuleFinding).verdict in VERDICT_ORDER)
    .sort((x, y) => VERDICT_ORDER[x.verdict] - VERDICT_ORDER[y.verdict] || x.code.localeCompare(y.code));
  const scope = r.scope && typeof r.scope === 'object' ? Object.fromEntries(Object.entries(r.scope).filter(([, v]) => typeof v === 'string')) as Record<string, string> : {};
  return { findings, scope };
}

const TOKEN_KEY = 'tacto-admin-token';
let memoryToken = '';

// 토큰은 브라우저 탭을 닫으면 사라지게 sessionStorage에 둔다 (막혀 있으면 메모리에만).
export function loadToken(): string {
  try { return globalThis.sessionStorage?.getItem(TOKEN_KEY) ?? memoryToken; } catch { return memoryToken; }
}
export function saveToken(token: string): void {
  memoryToken = token;
  try { if (token) globalThis.sessionStorage?.setItem(TOKEN_KEY, token); else globalThis.sessionStorage?.removeItem(TOKEN_KEY); } catch { /* 저장 불가: 메모리만 */ }
}

export class AdminAuthError extends Error {}

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new Error('서버 주소가 없어요. EXPO_PUBLIC_API_URL 설정 후 다시 실행해 주세요.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers: { ...(init.headers ?? {}), 'X-Admin-Token': token }, signal: controller.signal });
  } catch {
    throw new Error(controller.signal.aborted ? '응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.' : '서버에 연결할 수 없어요. 네트워크를 확인해 주세요.');
  } finally { clearTimeout(timeout); }
  if (response.status === 401) throw new AdminAuthError('관리자 토큰이 맞지 않아요.');
  if (response.status === 503) throw new Error('서버에 관리자 기능이 설정되지 않았어요.');
  if (response.status === 404) throw new Error('점검 기록을 찾지 못했어요.');
  if (!response.ok) throw new Error(`요청을 처리하지 못했어요. (HTTP ${response.status})`);
  return await response.json() as T;
}

export function listReports(token: string, onlyReported: boolean): Promise<ReportSummary[]> {
  return request<ReportSummary[]>('/api/admin/inspections?limit=100', token).then(rows =>
    onlyReported ? rows.filter(r => !!r.location?.address) : rows);
}

type RawDetail = Omit<ReportDetail, 'inspection' | 'findings' | 'scope'> & { result: unknown };
export function toDetail(raw: RawDetail): ReportDetail {
  const { result, ...rest } = raw;
  return { ...rest, inspection: parseInspection(result), ...toFindings(result) };
}

export async function getReport(token: string, id: string): Promise<ReportDetail> {
  return toDetail(await request<RawDetail>(`/api/admin/inspections/${encodeURIComponent(id)}`, token));
}

export async function updateReport(token: string, id: string, change: { status?: ReportStatus; admin_memo?: string }): Promise<ReportDetail> {
  return toDetail(await request<RawDetail>(`/api/admin/inspections/${encodeURIComponent(id)}`, token, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(change),
  }));
}

// 관리자용 AI 분석 이미지 (영역·중심선·연장선·판정 위치를 겹친 사진). 토큰 헤더가 필요해 <Image uri>로 바로 못 불러서
// 받아서 data URL로 바꿔 준다. 이 기능 전에 접수된 점검은 이미지가 없어 null.
export async function getAnalysisImage(token: string, id: string): Promise<string | null> {
  if (!API_URL) throw new Error('서버 주소가 없어요. EXPO_PUBLIC_API_URL 설정 후 다시 실행해 주세요.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/admin/inspections/${encodeURIComponent(id)}/analysis`, { headers: { 'X-Admin-Token': token }, signal: controller.signal });
  } catch {
    throw new Error(controller.signal.aborted ? '응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.' : '서버에 연결할 수 없어요. 네트워크를 확인해 주세요.');
  } finally { clearTimeout(timeout); }
  if (response.status === 404) return null;
  if (response.status === 401) throw new AdminAuthError('관리자 토큰이 맞지 않아요.');
  if (!response.ok) throw new Error(`분석 이미지를 불러오지 못했어요. (HTTP ${response.status})`);
  return blobToDataUrl(await response.blob());
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('분석 이미지를 읽지 못했어요.'));
    reader.readAsDataURL(blob);
  });
}

export function photoUrl(r: ReportSummary): string | null {
  return r.photo_url ? `${API_URL}${r.photo_url}` : null;
}

// 촬영 좌표로 카카오맵 핀 링크를 만든다 (API 키 없이 쓰는 공개 URL, 호출 비용 없음). 좌표가 없거나 범위 밖이면 null.
export function mapUrl(loc?: Location | null): string | null {
  const lat = loc?.lat, lng = loc?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const name = (loc?.address?.trim() || '신고 위치').replace(/,/g, ' ');
  return `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;
}

// 접수 시각 표시: "11/15 16:30"
export function formatTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

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
export type ReportDetail = ReportSummary & { admin_memo?: string | null; updated_at?: string | null; inspection: Inspection };

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

type RawDetail = Omit<ReportDetail, 'inspection'> & { result: unknown };
function toDetail(raw: RawDetail): ReportDetail {
  const { result, ...rest } = raw;
  return { ...rest, inspection: parseInspection(result) };
}

export async function getReport(token: string, id: string): Promise<ReportDetail> {
  return toDetail(await request<RawDetail>(`/api/admin/inspections/${encodeURIComponent(id)}`, token));
}

export async function updateReport(token: string, id: string, change: { status?: ReportStatus; admin_memo?: string }): Promise<ReportDetail> {
  return toDetail(await request<RawDetail>(`/api/admin/inspections/${encodeURIComponent(id)}`, token, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(change),
  }));
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

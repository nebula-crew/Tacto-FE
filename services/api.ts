import { Platform } from 'react-native';
import { parseInspection } from './inspection-schema';
import type { Inspection, Photo } from '../types/inspection';
export { parseInspection } from './inspection-schema';
export type RequestStage = 'preparing' | 'waiting' | 'report';
export const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '') ?? '';
export async function createInspection(photo: Photo, signal: AbortSignal, onStage: (stage: RequestStage) => void): Promise<Inspection> {
  if (!API_URL) throw new Error('서버 주소가 없어요. EXPO_PUBLIC_API_URL 설정 후 다시 실행해 주세요.');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) controller.abort();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 60000);
  try {
    onStage('preparing');
    const form = new FormData();
    if (Platform.OS === 'web') {
      const file = photo.file ?? await (await fetch(photo.uri, { signal: controller.signal })).blob();
      form.append('photo', file, photo.name);
    } else form.append('photo', { uri: photo.uri, name: photo.name, type: photo.mimeType } as unknown as Blob);
    onStage('waiting');
    const response = await fetch(`${API_URL}/api/inspections`, { method: 'POST', body: form, signal: controller.signal });
    if (!response.ok) throw new Error(`분석 요청을 완료하지 못했어요. (HTTP ${response.status})`);
    onStage('report');
    return parseInspection(await response.json());
  } catch (error) {
    if (timedOut) throw new Error('응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.');
    if (signal.aborted) throw new Error('점검을 취소했어요.');
    if (error instanceof TypeError) throw new Error('서버에 연결할 수 없어요. 네트워크와 서버 주소를 확인해 주세요.');
    throw error;
  } finally { clearTimeout(timeout); signal.removeEventListener('abort', cancel); }
}

export type ReportInput = { address: string; memo?: string };

// 신고 접수: 발견 위치·내용을 점검 건에 저장한다 (관리자 신고 목록에 나옴). BE docs/API.md 신고 접수.
export async function submitReport(inspectionId: string, input: ReportInput): Promise<void> {
  if (!API_URL) throw new Error('서버 주소가 없어요. EXPO_PUBLIC_API_URL 설정 후 다시 실행해 주세요.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/inspections/${encodeURIComponent(inspectionId)}/report`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: controller.signal,
    });
  } catch {
    throw new Error(controller.signal.aborted ? '응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.' : '서버에 연결할 수 없어요. 네트워크를 확인해 주세요.');
  } finally { clearTimeout(timeout); }
  if (response.ok) return;
  if (response.status === 409) throw new Error('이미 담당자가 확인 중인 신고라 수정할 수 없어요.');
  if (response.status === 404) throw new Error('점검 기록을 찾지 못했어요. 다시 점검한 뒤 신고해 주세요.');
  if (response.status === 422) throw new Error('발견 위치와 내용을 확인해 주세요. (위치 200자, 내용 1000자 이내)');
  if (response.status === 429) throw new Error('요청이 너무 많아요. 1분 뒤에 다시 시도해 주세요.');
  throw new Error(`신고를 접수하지 못했어요. 잠시 후 다시 시도해 주세요. (HTTP ${response.status})`);
}

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
      form.append('file', file, photo.name);
    } else form.append('file', { uri: photo.uri, name: photo.name, type: photo.mimeType } as unknown as Blob);
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

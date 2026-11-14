import { Platform } from 'react-native';
import type { Inspection, Photo } from '../types/inspection';

export const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '') ?? '';
export function parseInspection(value: unknown): Inspection {
  if (!value || typeof value !== 'object') throw new Error('서버 응답 형식을 확인해 주세요.');
  const v = value as Record<string, unknown>;
  const statuses = ['suspected', 'normal', 'hold'];
  if (typeof v.id !== 'string' || !statuses.includes(String(v.status)) || typeof v.summary !== 'string' || !Array.isArray(v.checks)) throw new Error('서버 응답 형식이 계약과 다릅니다.');
  for (const item of v.checks) {
    if (!item || typeof item !== 'object' || typeof item.code !== 'string' || typeof item.title !== 'string' || typeof item.detail !== 'string' || ![...statuses, 'not_applicable'].includes(item.status)) throw new Error('점검 항목 응답 형식을 확인해 주세요.');
  }
  return value as Inspection;
}
export async function createInspection(photo: Photo): Promise<Inspection> {
  if (!API_URL) throw new Error('서버 주소가 설정되지 않았습니다. README의 연결 설정을 확인해 주세요.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const form = new FormData();
    if (Platform.OS === 'web') {
      const file = photo.file ?? await (await fetch(photo.uri)).blob();
      form.append('file', file, photo.name);
    } else {
      form.append('file', { uri: photo.uri, name: photo.name, type: photo.mimeType } as unknown as Blob);
    }
    const response = await fetch(`${API_URL}/api/inspections`, { method: 'POST', body: form, signal: controller.signal });
    if (!response.ok) throw new Error(`분석 요청을 완료하지 못했습니다. (HTTP ${response.status})`);
    return parseInspection(await response.json());
  } catch (error) {
    if (controller.signal.aborted) throw new Error('분석 응답이 늦어지고 있습니다. 잠시 후 다시 시도해 주세요.');
    if (error instanceof TypeError) throw new Error('서버에 연결할 수 없습니다. 네트워크와 서버 주소를 확인해 주세요.');
    throw error;
  } finally { clearTimeout(timeout); }
}

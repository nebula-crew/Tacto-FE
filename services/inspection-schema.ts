import type { Inspection } from '../types/inspection';
export function parseInspection(value: unknown): Inspection {
  if (!value || typeof value !== 'object') throw new Error('서버 응답 형식을 확인해 주세요.');
  const v = value as Record<string, unknown>;
  const statuses = ['suspected', 'normal', 'hold'];
  if (typeof v.id !== 'string' || typeof v.status !== 'string' || !statuses.includes(v.status) || typeof v.summary !== 'string' || !Array.isArray(v.checks)) throw new Error('서버 응답 형식이 계약과 다릅니다.');
  for (const item of v.checks) {
    if (!item || typeof item !== 'object' || typeof item.code !== 'string' || typeof item.title !== 'string' || typeof item.detail !== 'string' || typeof item.status !== 'string' || ![...statuses, 'not_applicable'].includes(item.status)) throw new Error('점검 항목 응답 형식을 확인해 주세요.');
  }
  return value as Inspection;
}

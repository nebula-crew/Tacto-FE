import * as Location from 'expo-location';
import type { Coords } from '../types/inspection';

// 사진 촬영 직후 현재 위치(위도·경도)를 한 번 받는다. 갤러리 사진에는 쓰지 않는다 (찍은 곳과 지금 위치가 다를 수 있음).
// 권한 거부·실내·시간 초과 등 어떤 이유로든 못 받으면 null — 위치 없이도 점검은 그대로 진행한다.
export async function getCurrentCoords(timeoutMs = 10000): Promise<Coords | null> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return null;
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>(resolve => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (!position) return null;
    return toCoords(position.coords.latitude, position.coords.longitude);
  } catch {
    return null;
  }
}

// 서버 Location 검증(위도 ±90, 경도 ±180)과 같은 범위만 통과시킨다. 소수 6자리(약 10cm)면 충분하다.
export function toCoords(lat: unknown, lng: unknown): Coords | null {
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
}

// 최대 waitMs만 기다린다. 점검 시작을 위치 때문에 오래 붙잡지 않기 위함.
export function settleWithin<T>(promise: Promise<T | null> | null, waitMs: number): Promise<T | null> {
  if (!promise) return Promise.resolve(null);
  return Promise.race([promise.catch(() => null), new Promise<null>(resolve => setTimeout(() => resolve(null), waitMs))]);
}

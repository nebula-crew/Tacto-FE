import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Coords, Inspection, InspectionStatus, Photo } from '../types/inspection';
import { createInspection, type RequestStage } from './api';
import { demoInspection } from '../constants/demo';
import { readIntroDone, writeIntroDone } from './preferences';
import { getCurrentCoords, settleWithin } from './location';

// 점검 시작 때 촬영 위치를 이만큼까지만 기다린다. 못 받으면 위치 없이 보낸다.
const LOCATION_WAIT_MS = 4000;

type State = {
  photo: Photo | null; coords: Coords | null; locating: boolean; result: Inspection | null; demo: boolean; pending: boolean; stage: RequestStage; error: string;
  preferencesReady: boolean; introDone: boolean; preferencesError: string;
  completeIntro: () => Promise<void>; continueWithoutSaving: () => void;
  selectPhoto: (photo: Photo | null, demo?: boolean, locate?: boolean) => void; start: (demoStatus?: InspectionStatus) => void; cancel: () => void;
};
const Context = createContext<State | null>(null);
export function InspectionProvider({ children }: { children: ReactNode }) {
  const [photo, setPhoto] = useState<Photo | null>(null), [result, setResult] = useState<Inspection | null>(null);
  const [demo, setDemo] = useState(false), [pending, setPending] = useState(false), [stage, setStage] = useState<RequestStage>('preparing'), [error, setError] = useState('');
  const [preferencesReady, setReady] = useState(false), [introDone, setDone] = useState(false), [preferencesError, setPreferencesError] = useState('');
  const [coords, setCoords] = useState<Coords | null>(null), [locating, setLocating] = useState(false);
  const active = useRef<AbortController | null>(null);
  const location = useRef<Promise<Coords | null> | null>(null);
  useEffect(() => {
    let mounted = true;
    readIntroDone().then(value => { if (mounted) setDone(value); }).catch(() => { if (mounted) setPreferencesError('기기 저장소에 접근하지 못했어요. 안내가 다시 보일 수 있어요.'); }).finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; active.current?.abort(); };
  }, []);
  async function completeIntro() {
    try { await writeIntroDone(); setDone(true); setPreferencesError(''); }
    catch { setPreferencesError('안내 완료 상태를 저장하지 못했어요. 다시 시도하거나 이번만 건너뛸 수 있어요.'); throw new Error('Storage unavailable'); }
  }
  // locate: 카메라로 막 찍은 사진일 때만 true. 갤러리·예시 사진은 위치를 붙이지 않는다.
  function selectPhoto(next: Photo | null, isDemo = false, locate = false) {
    if (active.current) return;
    setPhoto(next); setResult(null); setDemo(isDemo); setError(''); setCoords(null);
    const request = locate && next && !isDemo ? getCurrentCoords() : null;
    location.current = request; setLocating(!!request);
    request?.then(value => { if (location.current === request) { setCoords(value); setLocating(false); } });
  }
  function cancel() { const current = active.current; active.current = null; current?.abort(); setPending(false); setError('점검을 취소했어요. 사진을 확인한 뒤 다시 요청할 수 있어요.'); }
  function start(demoStatus: InspectionStatus = 'suspected') {
    if (active.current || (!demo && !photo)) return;
    const controller = new AbortController(); active.current = controller; setPending(true); setError(''); setResult(null); setStage('preparing');
    const run = async () => {
      try {
        let value: Inspection;
        if (demo) {
          for (const next of ['preparing', 'waiting', 'report'] as const) {
            if (controller.signal.aborted) return;
            setStage(next); await new Promise<void>(resolve => setTimeout(resolve, 900));
          }
          value = demoInspection(demoStatus);
        } else {
          setStage('preparing');
          const at = await settleWithin(location.current, LOCATION_WAIT_MS);
          if (controller.signal.aborted) return;
          setCoords(at);
          value = await createInspection(photo!, controller.signal, setStage, at);
          // 결과를 받은 뒤 마지막 단계를 읽을 수 있도록 잠시 표시한다.
          await new Promise<void>(resolve => setTimeout(resolve, 900));
        }
        if (active.current === controller && !controller.signal.aborted) setResult(value);
      } catch (e) { if (active.current === controller) setError(e instanceof Error ? e.message : '점검 요청에 실패했어요.'); }
      finally { if (active.current === controller) { active.current = null; setPending(false); } }
    };
    void run();
  }
  return <Context.Provider value={{ photo, coords, locating, result, demo, pending, stage, error, preferencesReady, introDone, preferencesError, completeIntro, continueWithoutSaving: () => setDone(true), selectPhoto, start, cancel }}>{children}</Context.Provider>;
}
export function useInspection() { const state = useContext(Context); if (!state) throw new Error('InspectionProvider missing'); return state; }

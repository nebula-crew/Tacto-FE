import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Inspection, InspectionStatus, Photo } from '../types/inspection';
import { createInspection, type RequestStage } from './api';
import { demoInspection } from '../constants/demo';
import { readIntroDone, writeIntroDone } from './preferences';

type State = {
  photo: Photo | null; result: Inspection | null; demo: boolean; pending: boolean; stage: RequestStage; error: string;
  preferencesReady: boolean; introDone: boolean; preferencesError: string;
  completeIntro: () => Promise<void>; continueWithoutSaving: () => void;
  selectPhoto: (photo: Photo | null, demo?: boolean) => void; start: (demoStatus?: InspectionStatus) => void; cancel: () => void;
};
const Context = createContext<State | null>(null);
export function InspectionProvider({ children }: { children: ReactNode }) {
  const [photo, setPhoto] = useState<Photo | null>(null), [result, setResult] = useState<Inspection | null>(null);
  const [demo, setDemo] = useState(false), [pending, setPending] = useState(false), [stage, setStage] = useState<RequestStage>('preparing'), [error, setError] = useState('');
  const [preferencesReady, setReady] = useState(false), [introDone, setDone] = useState(false), [preferencesError, setPreferencesError] = useState('');
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    let mounted = true;
    readIntroDone().then(value => { if (mounted) setDone(value); }).catch(() => { if (mounted) setPreferencesError('기기 저장소에 접근하지 못했어요. 안내가 다시 보일 수 있어요.'); }).finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; active.current?.abort(); };
  }, []);
  async function completeIntro() {
    try { await writeIntroDone(); setDone(true); setPreferencesError(''); }
    catch { setPreferencesError('안내 완료 상태를 저장하지 못했어요. 다시 시도하거나 이번만 건너뛸 수 있어요.'); throw new Error('Storage unavailable'); }
  }
  function selectPhoto(next: Photo | null, isDemo = false) { if (active.current) return; setPhoto(next); setResult(null); setDemo(isDemo); setError(''); }
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
        } else value = await createInspection(photo!, controller.signal, setStage);
        if (active.current === controller && !controller.signal.aborted) setResult(value);
      } catch (e) { if (active.current === controller) setError(e instanceof Error ? e.message : '점검 요청에 실패했어요.'); }
      finally { if (active.current === controller) { active.current = null; setPending(false); } }
    };
    void run();
  }
  return <Context.Provider value={{ photo, result, demo, pending, stage, error, preferencesReady, introDone, preferencesError, completeIntro, continueWithoutSaving: () => setDone(true), selectPhoto, start, cancel }}>{children}</Context.Provider>;
}
export function useInspection() { const state = useContext(Context); if (!state) throw new Error('InspectionProvider missing'); return state; }

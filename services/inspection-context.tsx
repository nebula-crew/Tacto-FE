import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Inspection, Photo } from '../types/inspection';
type State = { photo: Photo | null; setPhoto: (v: Photo | null) => void; result: Inspection | null; setResult: (v: Inspection | null) => void; demo: boolean; setDemo: (v: boolean) => void };
const Context = createContext<State | null>(null);
export function InspectionProvider({ children }: { children: ReactNode }) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [result, setResult] = useState<Inspection | null>(null);
  const [demo, setDemo] = useState(false);
  return <Context.Provider value={{ photo, setPhoto, result, setResult, demo, setDemo }}>{children}</Context.Provider>;
}
export function useInspection() { const state = useContext(Context); if (!state) throw new Error('InspectionProvider missing'); return state; }

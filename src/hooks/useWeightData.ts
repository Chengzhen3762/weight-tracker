import { useState, useCallback, useEffect, useMemo } from 'react';

export interface WeightEntry {
  id: string;
  date: string;   // YYYY-MM-DD
  weight: number;
  note: string;
  time: string;    // HH:MM
}

interface State {
  entries: WeightEntry[];
  goalWeight: number;
  bodyFatPercent: number | null;
  leanMass: number | null;
}

const KEY = 'weight-tracker-v2';
const init: State = { entries: [], goalWeight: 170, bodyFatPercent: null, leanMass: null };

function load(): State {
  try {
    const r = localStorage.getItem(KEY);
    if (r) return { ...init, ...JSON.parse(r) };
  } catch { /* ignore */ }
  return init;
}

function persist(s: State) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

let _c = 0;
function uid(): string {
  return Date.now().toString(36) + (_c++).toString(36) + Math.random().toString(36).slice(2, 7);
}

export function useWeightData() {
  const [state, setState] = useState<State>(load);
  useEffect(() => { persist(state); }, [state]);

  const sorted = useMemo(
    () => [...state.entries].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
    [state.entries],
  );

  const addEntry = useCallback((e: Omit<WeightEntry, 'id'>) => {
    setState(p => ({ ...p, entries: [...p.entries, { ...e, id: uid() }] }));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setState(p => ({ ...p, entries: p.entries.filter(e => e.id !== id) }));
  }, []);

  const updateEntry = useCallback((id: string, u: Partial<Omit<WeightEntry, 'id'>>) => {
    setState(p => ({ ...p, entries: p.entries.map(e => (e.id === id ? { ...e, ...u } : e)) }));
  }, []);

  const setGoalWeight = useCallback((g: number) => {
    setState(p => ({ ...p, goalWeight: g }));
  }, []);

  const setBodyMetrics = useCallback((bf: number | null, lm: number | null) => {
    setState(p => ({ ...p, bodyFatPercent: bf, leanMass: lm }));
  }, []);

  const clearAll = useCallback(() => setState(init), []);

  const loadSampleData = useCallback(() => {
    const today = new Date();
    const entries: WeightEntry[] = [];
    const w = [185.2,184.8,184.5,184.9,184.1,183.7,183.4,183.8,183.0,182.6,182.3,182.7,181.9,181.5,181.2,181.6,180.8,180.4,180.1,180.5,179.7,179.3,179.0,179.4,178.6,178.2,178.8,178.4];
    const notes = ['Morning · Fasted','Post-workout','Morning weigh-in','Before bed','After meal'];
    for (let i = 0; i < w.length; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (w.length - 1 - i));
      entries.push({
        id: uid(),
        date: d.toISOString().slice(0, 10),
        weight: w[i],
        note: notes[i % notes.length],
        time: `07:${String(5 + ((i * 7) % 50)).padStart(2, '0')}`,
      });
    }
    setState({ entries, goalWeight: 170, bodyFatPercent: 18.2, leanMass: 146 });
  }, []);

  /* ---- Computed ---- */
  const latest = sorted[0] ?? null;

  const weeklyChange = useMemo(() => {
    if (sorted.length < 2 || !latest) return null;
    const wa = new Date(latest.date);
    wa.setDate(wa.getDate() - 7);
    const ws = wa.toISOString().slice(0, 10);
    const old = sorted.filter(e => e.date <= ws);
    if (old.length > 0) return +(latest.weight - old[0].weight).toFixed(1);
    const oldest = sorted[sorted.length - 1];
    if (oldest.id === latest.id) return null;
    return +(latest.weight - oldest.weight).toFixed(1);
  }, [sorted, latest]);

  const weeklyAvg = useMemo(() => {
    if (!sorted.length) return null;
    const wa = new Date(sorted[0].date);
    wa.setDate(wa.getDate() - 7);
    const ws = wa.toISOString().slice(0, 10);
    const r = sorted.filter(e => e.date >= ws);
    if (!r.length) return sorted[0].weight;
    return +(r.reduce((s, e) => s + e.weight, 0) / r.length).toFixed(1);
  }, [sorted]);

  const trendPct = useMemo(() => {
    if (weeklyChange === null || !latest) return null;
    return +((weeklyChange / latest.weight) * 100).toFixed(1);
  }, [weeklyChange, latest]);

  const progressPct = useMemo(() => {
    if (!sorted.length) return 0;
    const start = sorted[sorted.length - 1].weight;
    const cur = sorted[0].weight;
    const g = state.goalWeight;
    if (start === g) return cur === g ? 100 : 0;
    if (start > g) {
      return Math.max(0, Math.min(100, Math.round(((start - cur) / (start - g)) * 100)));
    }
    return Math.max(0, Math.min(100, Math.round(((cur - start) / (g - start)) * 100)));
  }, [sorted, state.goalWeight]);

  const isOnTrack = useMemo(() => {
    if (weeklyChange === null || !latest) return null;
    if (latest.weight > state.goalWeight) return weeklyChange <= 0;
    if (latest.weight < state.goalWeight) return weeklyChange >= 0;
    return true;
  }, [weeklyChange, latest, state.goalWeight]);

  const remaining = latest ? +Math.abs(latest.weight - state.goalWeight).toFixed(1) : null;
  const atGoal = latest ? latest.weight <= state.goalWeight : false;

  return {
    entries: sorted, latest, goalWeight: state.goalWeight,
    bodyFat: state.bodyFatPercent, leanMass: state.leanMass,
    weeklyChange, weeklyAvg, trendPct, progressPct, isOnTrack, remaining, atGoal,
    addEntry, deleteEntry, updateEntry, setGoalWeight, setBodyMetrics, clearAll, loadSampleData,
  };
}

export type WeightDataHook = ReturnType<typeof useWeightData>;

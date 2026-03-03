import React, { useState, useEffect, useMemo } from 'react';
import type { WeightDataHook } from '../hooks/useWeightData';
import { ChevronLeftIcon, MoreHorizontalIcon, BodyIcon, MuscleIcon } from './Icons';

interface Props {
  data: WeightDataHook;
  onBack: () => void;
}

const timeFilters = ['W', 'M', '3M', '6M', 'Y', 'All'] as const;
const filterDays: Record<string, number | null> = { W: 7, M: 30, '3M': 90, '6M': 180, Y: 365, All: null };

/* ── helpers ── */

interface ChartPoint {
  date: string;
  weight: number;
  x: number;
  y: number;
}

function aggregateByDate(entries: { date: string; weight: number }[]): { date: string; weight: number }[] {
  const map = new Map<string, number[]>();
  entries.forEach(e => {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date)!.push(e.weight);
  });
  return Array.from(map.entries())
    .map(([date, ws]) => ({ date, weight: +(ws.reduce((a, b) => a + b, 0) / ws.length).toFixed(1) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildSmoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

function formatAxisDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${m[d.getMonth()]} ${d.getDate()}`;
}

function getMonthName(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()];
}

/* ── Line Chart ── */

const LineChart: React.FC<{
  points: ChartPoint[];
  goalWeight: number;
  selectedIndex: number;
  onSelect: (i: number) => void;
  chartW: number;
  chartH: number;
}> = ({ points, goalWeight, selectedIndex, onSelect, chartW, chartH }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, [points.length]);

  const padX = 20, padY = 20;

  const weights = points.map(p => p.weight);
  const allW = [...weights, goalWeight];
  const minW = Math.min(...allW) - 2;
  const maxW = Math.max(...allW) + 2;

  const scaleY = (w: number) => padY + ((maxW - w) / (maxW - minW)) * (chartH - 2 * padY);

  const scaledPts = points.map(p => ({ ...p, y: scaleY(p.weight) }));

  const linePath = buildSmoothPath(scaledPts);
  const fillPath = scaledPts.length >= 2
    ? `${linePath} L ${scaledPts[scaledPts.length - 1].x},${chartH} L ${scaledPts[0].x},${chartH} Z`
    : '';

  const goalY = scaleY(goalWeight);
  const goalInRange = goalY >= padY && goalY <= chartH - padY;

  const selPt = scaledPts[selectedIndex] || scaledPts[scaledPts.length - 1];

  // X-axis labels
  const labelCount = 5;
  const xLabels: { x: number; label: string }[] = [];
  if (points.length >= 2) {
    for (let i = 0; i < labelCount; i++) {
      const idx = Math.round((i / (labelCount - 1)) * (points.length - 1));
      xLabels.push({ x: scaledPts[idx].x, label: formatAxisDate(points[idx].date) });
    }
  } else if (points.length === 1) {
    xLabels.push({ x: scaledPts[0].x, label: formatAxisDate(points[0].date) });
  }

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: 200 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="cg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#F97316" stopOpacity="1" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Grid lines — theme-aware */}
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const y = padY + f * (chartH - 2 * padY);
          return <line key={i} x1={padX} y1={y} x2={chartW - padX} y2={y} strokeWidth="0.8" style={{ stroke: 'var(--color-grid-line)' }} />;
        })}

        {/* Goal line */}
        {goalInRange && (
          <>
            <line x1={padX} y1={goalY} x2={chartW - padX} y2={goalY} stroke="#F97316" strokeWidth="1" strokeDasharray="6,4" opacity="0.35" />
            <text x={chartW - padX - 2} y={goalY - 6} textAnchor="end" fill="#F97316" fontSize="9" fontWeight="600" opacity="0.6" fontFamily="Inter, sans-serif">
              Goal {goalWeight}
            </text>
          </>
        )}

        {/* Fill */}
        {fillPath && (
          <path d={fillPath} fill="url(#cg)" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 1s ease' }} />
        )}

        {/* Line */}
        {scaledPts.length >= 2 && (
          <path
            d={linePath}
            fill="none" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{
              strokeDasharray: mounted ? '0' : '2000',
              strokeDashoffset: mounted ? '0' : '2000',
              transition: 'stroke-dasharray 1.5s ease, stroke-dashoffset 1.5s ease',
            }}
          />
        )}

        {/* Dots — theme-aware fill */}
        {scaledPts.map((pt, i) => (
          <circle
            key={i} cx={pt.x} cy={pt.y}
            r={i === selectedIndex ? 0 : scaledPts.length > 30 ? 1.5 : 2.5}
            stroke="#F97316" strokeWidth="1.5"
            style={{ fill: 'var(--color-chart-dot)', opacity: mounted ? 0.6 : 0, transition: 'opacity 0.5s ease' }}
          />
        ))}

        {/* Selected marker */}
        {mounted && selPt && (
          <>
            <line x1={selPt.x} y1={selPt.y + 10} x2={selPt.x} y2={chartH} stroke="#F97316" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
            <circle cx={selPt.x} cy={selPt.y} r="8" fill="#F97316" opacity="0.15" className="pulse-dot" />
            <circle cx={selPt.x} cy={selPt.y} r="5" stroke="#F97316" strokeWidth="2.5" style={{ fill: 'var(--color-chart-dot)' }} />
          </>
        )}

        {/* Single point */}
        {scaledPts.length === 1 && mounted && (
          <>
            <circle cx={scaledPts[0].x} cy={scaledPts[0].y} r="8" fill="#F97316" opacity="0.15" className="pulse-dot" />
            <circle cx={scaledPts[0].x} cy={scaledPts[0].y} r="5" stroke="#F97316" strokeWidth="2.5" style={{ fill: 'var(--color-chart-dot)' }} />
          </>
        )}

        {/* Touch targets */}
        {scaledPts.map((pt, i) => (
          <rect
            key={`t-${i}`}
            x={pt.x - Math.max(12, (chartW - 2 * padX) / scaledPts.length / 2)}
            y={0}
            width={Math.max(24, (chartW - 2 * padX) / scaledPts.length)}
            height={chartH}
            fill="transparent" className="cursor-pointer"
            onClick={() => onSelect(i)}
          />
        ))}
      </svg>

      {/* X labels */}
      <div className="flex justify-between px-6 mt-1">
        {xLabels.map((l, i) => (
          <span key={i} className="text-text-tertiary text-[10px] font-medium">{l.label}</span>
        ))}
      </div>
    </div>
  );
};

/* ── Empty Chart State ── */

const EmptyChart: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="w-14 h-14 rounded-[16px] bg-accent-muted flex items-center justify-center mb-4">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-6 4 3 5-7" />
      </svg>
    </div>
    <p className="text-text-secondary text-[15px] font-medium">No data for this period</p>
    <p className="text-text-tertiary text-[13px] mt-1">Log weights to see your trend</p>
  </div>
);

/* ── Weight Trend Screen ── */

const WeightTrend: React.FC<Props> = ({ data, onBack }) => {
  const [selectedFilter, setSelectedFilter] = useState(1); // M
  const [selectedGoal, setSelectedGoal] = useState(data.goalWeight);
  const [selectedDataIndex, setSelectedDataIndex] = useState(-1);

  useEffect(() => setSelectedGoal(data.goalWeight), [data.goalWeight]);

  const filteredData = useMemo(() => {
    const filterKey = timeFilters[selectedFilter];
    const days = filterDays[filterKey];
    const all = data.entries;
    if (!days || !all.length) return aggregateByDate(all);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cs = cutoff.toISOString().slice(0, 10);
    const filtered = all.filter(e => e.date >= cs);
    return aggregateByDate(filtered.length ? filtered : all);
  }, [data.entries, selectedFilter]);

  const chartW = 360, chartH = 180, padX = 20;
  const chartPoints: ChartPoint[] = useMemo(() => {
    if (!filteredData.length) return [];
    if (filteredData.length === 1) {
      return [{ ...filteredData[0], x: chartW / 2, y: chartH / 2 }];
    }
    return filteredData.map((d, i) => ({
      ...d,
      x: padX + (i / (filteredData.length - 1)) * (chartW - 2 * padX),
      y: 0,
    }));
  }, [filteredData]);

  const selIdx = selectedDataIndex < 0 || selectedDataIndex >= chartPoints.length
    ? chartPoints.length - 1
    : selectedDataIndex;

  const selectedEntry = chartPoints[selIdx] || null;

  useEffect(() => setSelectedDataIndex(-1), [selectedFilter]);

  const goalPresets = useMemo(() => {
    const base = Math.round(data.goalWeight / 5) * 5;
    const presets = new Set<number>();
    for (let i = -2; i <= 2; i++) presets.add(base + i * 5);
    return Array.from(presets).sort((a, b) => a - b);
  }, [data.goalWeight]);

  const periodChange = useMemo(() => {
    if (filteredData.length < 2) return null;
    return +(filteredData[filteredData.length - 1].weight - filteredData[0].weight).toFixed(1);
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-warm-bg pb-10">
      {/* Header */}
      <div className="px-5 pt-14 pb-3 animate-fade-in-up delay-1">
        <div className="flex items-center justify-between">
          <button onClick={onBack}
            className="w-11 h-11 rounded-2xl bg-warm-card flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-warm-border/40 active:scale-95 transition-transform">
            <ChevronLeftIcon size={20} color="var(--color-icon-default)" />
          </button>
          <h1 className="text-text-primary text-[18px] font-bold tracking-tight">Weight Trend</h1>
          <button className="w-11 h-11 rounded-2xl bg-warm-card flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-warm-border/40 active:scale-95 transition-transform">
            <MoreHorizontalIcon size={20} color="var(--color-icon-default)" />
          </button>
        </div>
      </div>

      {/* Time Filter */}
      <div className="px-5 mt-4 animate-fade-in-up delay-2">
        <div className="bg-warm-card rounded-[16px] p-1.5 flex gap-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-warm-border/30">
          {timeFilters.map((f, i) => (
            <button
              key={f}
              onClick={() => setSelectedFilter(i)}
              className={`flex-1 py-2.5 rounded-[12px] text-[13px] font-semibold transition-all duration-300 ${
                selectedFilter === i
                  ? 'bg-accent text-white shadow-[0_2px_8px_rgba(249,115,22,0.3)]'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Card */}
      <div className="px-5 mt-5 animate-fade-in-up delay-3">
        <div className="bg-warm-card rounded-[24px] p-5 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-warm-border/30">
          {chartPoints.length > 0 ? (
            <>
              <div className="flex items-end justify-between mb-5">
                <div>
                  {selectedEntry && (
                    <>
                      <p className="text-text-secondary text-[12px] font-medium tracking-wide">
                        {getMonthName(selectedEntry.date)} {new Date(selectedEntry.date + 'T12:00:00').getDate()}
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-text-primary text-[36px] font-bold tracking-tight leading-none">
                          {selectedEntry.weight.toFixed(1)}
                        </span>
                        <span className="text-text-secondary text-[16px] font-medium">lbs</span>
                      </div>
                    </>
                  )}
                </div>
                {periodChange !== null && (
                  <div className={`flex items-center gap-1 rounded-full px-3 py-1.5 ${
                    periodChange <= 0 ? 'bg-success-light' : 'bg-danger-light'
                  }`}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d={periodChange <= 0 ? 'M1 3l4 4 4-4' : 'M1 7l4-4 4 4'}
                        stroke={periodChange <= 0 ? '#4CAF82' : '#EF4444'}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      />
                    </svg>
                    <span className={`text-[12px] font-semibold ${
                      periodChange <= 0 ? 'text-success' : 'text-danger'
                    }`}>
                      {Math.abs(periodChange)} lbs
                    </span>
                  </div>
                )}
              </div>

              <LineChart
                points={chartPoints}
                goalWeight={selectedGoal}
                selectedIndex={selIdx}
                onSelect={setSelectedDataIndex}
                chartW={chartW}
                chartH={chartH}
              />
            </>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>

      {/* Goal Weight Presets */}
      <div className="px-5 mt-5 animate-fade-in-up delay-4">
        <p className="text-text-secondary text-[13px] font-semibold tracking-wide uppercase mb-3 px-1">Goal Weight</p>
        <div className="flex gap-2.5">
          {goalPresets.map(g => (
            <button
              key={g}
              onClick={() => { setSelectedGoal(g); data.setGoalWeight(g); }}
              className={`flex-1 py-3.5 rounded-[16px] text-[15px] font-bold transition-all duration-300 ${
                selectedGoal === g
                  ? 'bg-accent text-white shadow-[0_4px_14px_rgba(249,115,22,0.35)]'
                  : 'bg-warm-card text-text-secondary shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-warm-border/30'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Body Insights */}
      <div className="px-5 mt-7 animate-fade-in-up delay-5">
        <h2 className="text-text-primary text-[20px] font-bold tracking-tight mb-4">Body Insights</h2>
        <div className="space-y-3">
          {/* Body Fat */}
          <div className="bg-warm-card rounded-[20px] px-5 py-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-warm-border/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-accent-muted flex items-center justify-center">
              <BodyIcon size={22} color="#F97316" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-[15px] font-semibold">Body Fat</p>
              <p className="text-text-tertiary text-[12px] mt-0.5">
                {data.bodyFat !== null ? 'Estimated from weight trend' : 'Set in settings'}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <div className={`rounded-full px-3 py-1.5 ${data.bodyFat !== null ? 'bg-accent-muted' : 'bg-warm-hover'}`}>
                <span className={`text-[16px] font-bold ${data.bodyFat !== null ? 'text-accent' : 'text-text-tertiary'}`}>
                  {data.bodyFat !== null ? `${data.bodyFat}%` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Lean Mass */}
          <div className="bg-warm-card rounded-[20px] px-5 py-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-warm-border/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-blue-bg flex items-center justify-center">
              <MuscleIcon size={22} color="var(--color-blue-text)" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-[15px] font-semibold">Lean Mass</p>
              <p className="text-text-tertiary text-[12px] mt-0.5">
                {data.leanMass !== null ? 'Fat-free body weight' : 'Set in settings'}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <div className={`rounded-full px-3 py-1.5 ${data.leanMass !== null ? 'bg-blue-bg' : 'bg-warm-hover'}`}>
                <span className={`text-[16px] font-bold ${data.leanMass !== null ? 'text-blue-text' : 'text-text-tertiary'}`}>
                  {data.leanMass !== null ? `${data.leanMass} lbs` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightTrend;

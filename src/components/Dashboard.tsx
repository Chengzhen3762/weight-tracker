import React, { useState } from 'react';
import type { WeightDataHook, WeightEntry } from '../hooks/useWeightData';
import type { NotificationsHook } from '../hooks/useNotifications';
import NotificationsPanel from './NotificationsPanel';
import {
  BellIcon, SettingsIcon, TrendDownIcon, TrendUpIcon,
  MoreHorizontalIcon, ChartIcon, PlusIcon, ScaleIcon,
  TrashIcon, EditIcon, CloseIcon, TargetIcon,
  MoonIcon, SunIcon,
} from './Icons';

/* ── Helpers ── */

function formatEntryDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const target = new Date(dateStr + 'T12:00:00');
  const ds = `${months[target.getMonth()]} ${target.getDate()}`;
  if (d.toDateString() === today.toDateString()) return `Today, ${ds}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${ds}`;
  return `${days[target.getDay()]}, ${ds}`;
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function todayLabel(): string {
  const d = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

/* ── Progress Ring ── */

const ProgressRing: React.FC<{ progress: number; size?: number; sw?: number }> = ({
  progress, size = 88, sw = 6,
}) => {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, progress)) / 100) * c;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw} strokeLinecap="round"
        style={{ stroke: 'var(--color-ring-track)' }}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F97316" strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.32,0.72,0,1)' }}
      />
    </svg>
  );
};

/* ── Settings Panel ── */

const SettingsPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  goalWeight: number;
  bodyFat: number | null;
  leanMass: number | null;
  setGoalWeight: (g: number) => void;
  setBodyMetrics: (bf: number | null, lm: number | null) => void;
  clearAll: () => void;
  loadSampleData: () => void;
  hasData: boolean;
}> = ({ isOpen, onClose, goalWeight, bodyFat, leanMass, setGoalWeight, setBodyMetrics, clearAll, loadSampleData, hasData }) => {
  const [gw, setGw] = useState(String(goalWeight));
  const [bf, setBf] = useState(bodyFat !== null ? String(bodyFat) : '');
  const [lm, setLm] = useState(leanMass !== null ? String(leanMass) : '');
  const [visible, setVisible] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setGw(String(goalWeight));
      setBf(bodyFat !== null ? String(bodyFat) : '');
      setLm(leanMass !== null ? String(leanMass) : '');
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
    }
  }, [isOpen, goalWeight, bodyFat, leanMass]);

  const handleSave = () => {
    const gwv = parseFloat(gw);
    if (gwv > 0) setGoalWeight(gwv);
    setBodyMetrics(
      bf ? parseFloat(bf) || null : null,
      lm ? parseFloat(lm) || null : null,
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div
        className={`absolute inset-0 transition-colors duration-300 ${visible ? 'bg-black/40' : 'bg-transparent'}`}
        onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
      />
      <div
        className={`relative w-full max-w-[430px] bg-warm-card rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-warm-border rounded-full" />
        </div>
        <div className="px-6 pb-8 pt-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-text-primary text-[22px] font-bold">Settings</h2>
            <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-warm-hover transition-colors">
              <CloseIcon size={18} color="var(--color-text-secondary)" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-text-tertiary text-[11px] font-semibold uppercase tracking-wider mb-1.5 block px-1">Goal Weight (lbs)</label>
              <input type="text" inputMode="decimal" value={gw} onChange={e => setGw(e.target.value)}
                className="w-full bg-input-bg rounded-2xl px-4 py-3 text-text-primary text-[16px] font-semibold outline-none border border-warm-border/50 focus:border-accent transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-tertiary text-[11px] font-semibold uppercase tracking-wider mb-1.5 block px-1">Body Fat %</label>
                <input type="text" inputMode="decimal" value={bf} onChange={e => setBf(e.target.value)} placeholder="—"
                  className="w-full bg-input-bg rounded-2xl px-4 py-3 text-text-primary text-[16px] font-semibold outline-none border border-warm-border/50 focus:border-accent transition-colors placeholder:text-text-tertiary/40" />
              </div>
              <div>
                <label className="text-text-tertiary text-[11px] font-semibold uppercase tracking-wider mb-1.5 block px-1">Lean Mass (lbs)</label>
                <input type="text" inputMode="decimal" value={lm} onChange={e => setLm(e.target.value)} placeholder="—"
                  className="w-full bg-input-bg rounded-2xl px-4 py-3 text-text-primary text-[16px] font-semibold outline-none border border-warm-border/50 focus:border-accent transition-colors placeholder:text-text-tertiary/40" />
              </div>
            </div>
          </div>

          <button onClick={handleSave}
            className="w-full py-4 bg-accent rounded-[20px] text-white text-[16px] font-bold shadow-[0_6px_20px_rgba(249,115,22,0.35)] active:scale-[0.98] transition-transform mb-3">
            Save Settings
          </button>

          <div className="flex gap-3">
            {!hasData && (
              <button onClick={() => { loadSampleData(); onClose(); }}
                className="flex-1 py-3 bg-input-bg rounded-[16px] text-text-secondary text-[14px] font-semibold active:scale-[0.98] transition-transform border border-warm-border/30">
                Load Sample Data
              </button>
            )}
            {hasData && (
              <button onClick={() => { if (confirm('Delete all weight data?')) { clearAll(); onClose(); } }}
                className="flex-1 py-3 bg-danger-light rounded-[16px] text-danger text-[14px] font-semibold active:scale-[0.98] transition-transform">
                Clear All Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Dashboard ── */

interface DashboardProps {
  data: WeightDataHook;
  notifHook: NotificationsHook;
  onNavigateToTrend: () => void;
  onAddWeight: () => void;
  onEditEntry: (entry: WeightEntry) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, notifHook, onNavigateToTrend, onAddWeight, onEditEntry, isDark, toggleTheme }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const hasData = data.entries.length > 0;
  const displayEntries = showAll ? data.entries : data.entries.slice(0, 7);

  return (
    <div className="min-h-screen bg-warm-bg pb-28">
      {/* Header — sticky so it's always reachable */}
      <div className="sticky top-0 z-40 bg-warm-bg/80 backdrop-blur-xl px-6 pt-14 pb-3 animate-fade-in-up delay-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-[13px] font-medium tracking-wide uppercase">{todayLabel()}</p>
            <h1 className="text-text-primary text-[28px] font-bold tracking-tight mt-0.5">{getGreeting()}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifications(true)}
              className="w-11 h-11 rounded-2xl bg-warm-card flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-warm-border/40 active:scale-95 transition-transform relative"
            >
              <BellIcon size={20} color="var(--color-icon-default)" />
              {notifHook.unreadCount > 0 && (
                <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-accent rounded-full flex items-center justify-center px-1">
                  <span className="text-white text-[10px] font-bold">{notifHook.unreadCount > 9 ? '9+' : notifHook.unreadCount}</span>
                </div>
              )}
            </button>
            <button
              onClick={toggleTheme}
              className="w-11 h-11 rounded-2xl bg-warm-card flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-warm-border/40 active:scale-95 transition-transform"
            >
              {isDark ? (
                <SunIcon size={20} color="var(--color-icon-default)" />
              ) : (
                <MoonIcon size={20} color="var(--color-icon-default)" />
              )}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-11 h-11 rounded-2xl bg-warm-card flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-warm-border/40 active:scale-95 transition-transform"
            >
              <SettingsIcon size={20} color="var(--color-icon-default)" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Empty State ── */}
      {!hasData && (
        <div className="px-5 mt-8 animate-fade-in-up delay-2">
          <div className="bg-warm-card rounded-[28px] px-8 py-12 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-warm-border/30 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-[24px] bg-accent-muted flex items-center justify-center mb-6">
              <ScaleIcon size={36} color="#F97316" />
            </div>
            <h2 className="text-text-primary text-[24px] font-bold tracking-tight mb-2">Start Your Journey</h2>
            <p className="text-text-secondary text-[15px] leading-relaxed mb-8 max-w-[280px]">
              Log your first weigh-in to begin tracking your progress toward your goals.
            </p>
            <button
              onClick={onAddWeight}
              className="w-full py-4 bg-accent rounded-[20px] text-white text-[16px] font-bold shadow-[0_6px_20px_rgba(249,115,22,0.35)] active:scale-[0.98] transition-transform mb-3"
            >
              Log First Weight
            </button>
            <button
              onClick={data.loadSampleData}
              className="text-text-tertiary text-[14px] font-medium py-2 active:text-accent transition-colors"
            >
              or try with sample data
            </button>
          </div>

          <div className="mt-6 bg-warm-card rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-warm-border/30 flex items-center gap-4">
            <div className="w-11 h-11 rounded-[14px] bg-accent-muted flex items-center justify-center flex-shrink-0">
              <TargetIcon size={20} color="#F97316" />
            </div>
            <div className="flex-1">
              <p className="text-text-primary text-[14px] font-semibold">Goal Weight</p>
              <p className="text-text-tertiary text-[12px]">Tap settings to change</p>
            </div>
            <span className="text-text-primary text-[18px] font-bold">{data.goalWeight} lbs</span>
          </div>
        </div>
      )}

      {/* ── Has Data ── */}
      {hasData && (
        <>
          {/* Main Weight Card */}
          <div className="px-5 mt-5 animate-fade-in-up delay-2">
            <div
              className="bg-warm-card rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-warm-border/30 cursor-pointer active:scale-[0.98] transition-transform duration-200"
              onClick={onNavigateToTrend}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-text-secondary text-[13px] font-medium tracking-wide">CURRENT WEIGHT</p>
                  {data.isOnTrack !== null && (
                    <div className={`mt-2 inline-flex items-center rounded-full px-3 py-1 ${
                      data.isOnTrack ? 'bg-accent-muted' : 'bg-warning-bg'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${data.isOnTrack ? 'bg-accent' : 'bg-warning-text'}`} />
                      <span className={`text-[12px] font-semibold ${data.isOnTrack ? 'text-accent' : 'text-warning-text'}`}>
                        {data.atGoal ? 'At Goal!' : data.isOnTrack ? 'On Track' : 'Needs Focus'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-text-tertiary">
                  <ChartIcon size={16} color="var(--color-text-tertiary)" />
                  <span className="text-[12px] font-medium">View Trend</span>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-text-primary text-[52px] font-bold tracking-tight leading-none">
                      {data.latest!.weight.toFixed(1)}
                    </span>
                    <span className="text-text-secondary text-[18px] font-medium mb-1">lbs</span>
                  </div>
                  {data.weeklyChange !== null && (
                    <div className="flex items-center gap-1.5 mt-3">
                      <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${
                        data.weeklyChange <= 0 ? 'bg-success-light' : 'bg-danger-light'
                      }`}>
                        {data.weeklyChange <= 0 ? (
                          <TrendDownIcon size={12} color="#4CAF82" />
                        ) : (
                          <TrendUpIcon size={12} color="#EF4444" />
                        )}
                        <span className={`text-[12px] font-semibold ${
                          data.weeklyChange <= 0 ? 'text-success' : 'text-danger'
                        }`}>
                          {data.weeklyChange > 0 ? '+' : ''}{data.weeklyChange} lbs
                        </span>
                      </div>
                      <span className="text-text-tertiary text-[12px]">this week</span>
                    </div>
                  )}
                </div>

                <div className="relative flex flex-col items-center">
                  <ProgressRing progress={data.progressPct} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-text-primary text-[18px] font-bold">{data.progressPct}%</span>
                    <span className="text-text-tertiary text-[10px] font-medium">to goal</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-warm-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span className="text-text-secondary text-[13px]">
                    Goal: <span className="font-semibold text-text-primary">{data.goalWeight} lbs</span>
                  </span>
                </div>
                <span className="text-text-tertiary text-[12px]">
                  {data.atGoal ? '🎉 Goal reached!' : `${data.remaining} lbs to go`}
                </span>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="px-5 mt-4 flex gap-3.5 animate-fade-in-up delay-3">
            <div className="flex-1 bg-warm-card rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-warm-border/30">
              <p className="text-text-tertiary text-[11px] font-semibold tracking-wider uppercase">Weekly Avg</p>
              {data.weeklyAvg !== null ? (
                <>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-text-primary text-[28px] font-bold tracking-tight">{data.weeklyAvg.toFixed(1)}</span>
                    <span className="text-text-secondary text-[14px] font-medium">lbs</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <div className="w-8 h-1 rounded-full bg-accent/20" />
                    <div className="w-6 h-1 rounded-full bg-accent/40" />
                    <div className="w-4 h-1 rounded-full bg-accent/60" />
                    <div className="w-3 h-1 rounded-full bg-accent" />
                  </div>
                </>
              ) : (
                <p className="mt-3 text-text-tertiary text-[14px]">No data yet</p>
              )}
            </div>
            <div className="flex-1 bg-warm-card rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-warm-border/30">
              <p className="text-text-tertiary text-[11px] font-semibold tracking-wider uppercase">Trend</p>
              {data.trendPct !== null ? (
                <>
                  <div className="mt-3 flex items-center gap-2">
                    {data.trendPct <= 0 ? (
                      <TrendDownIcon size={22} color="#4CAF82" />
                    ) : (
                      <TrendUpIcon size={22} color="#EF4444" />
                    )}
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-text-primary text-[28px] font-bold tracking-tight">
                        {Math.abs(data.trendPct).toFixed(1)}
                      </span>
                      <span className="text-text-secondary text-[14px] font-medium">%</span>
                    </div>
                  </div>
                  <p className={`text-[12px] font-medium mt-2 ${data.trendPct <= 0 ? 'text-success' : 'text-danger'}`}>
                    {data.trendPct <= 0 ? 'Losing steadily' : 'Gaining weight'}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-text-tertiary text-[14px]">Need more data</p>
              )}
            </div>
          </div>

          {/* History */}
          <div className="px-5 mt-7 animate-fade-in-up delay-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-text-primary text-[20px] font-bold tracking-tight">History</h2>
              {data.entries.length > 7 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-accent text-[13px] font-semibold active:opacity-70 transition-opacity"
                >
                  {showAll ? 'Show Less' : `See All (${data.entries.length})`}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {displayEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="bg-warm-card rounded-[18px] px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-warm-border/30 flex items-center justify-between transition-transform duration-150 relative"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-text-primary text-[14px] font-semibold">{formatEntryDate(entry.date)}</p>
                      {index === 0 && (
                        <div className="px-2 py-0.5 bg-accent-muted rounded-full">
                          <span className="text-accent text-[10px] font-bold">Latest</span>
                        </div>
                      )}
                    </div>
                    <p className="text-text-tertiary text-[12px] mt-1 truncate">
                      {entry.note || formatTime(entry.time)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <div className="text-right">
                      <span className="text-text-primary text-[20px] font-bold tracking-tight">{entry.weight.toFixed(1)}</span>
                      <span className="text-text-secondary text-[12px] ml-0.5">lbs</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedMenu(expandedMenu === entry.id ? null : entry.id); }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-warm-hover transition-colors"
                    >
                      <MoreHorizontalIcon size={18} color="var(--color-text-tertiary)" />
                    </button>
                  </div>

                  {/* Action Menu */}
                  {expandedMenu === entry.id && (
                    <div className="absolute top-2 right-2 z-20 bg-warm-card rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-warm-border overflow-hidden min-w-[140px]">
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedMenu(null); onEditEntry(entry); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-warm-hover transition-colors text-left"
                      >
                        <EditIcon size={16} color="var(--color-icon-default)" />
                        <span className="text-text-primary text-[14px] font-medium">Edit</span>
                      </button>
                      <div className="h-px bg-warm-border mx-3" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedMenu(null); data.deleteEntry(entry.id); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-danger-light transition-colors text-left"
                      >
                        <TrashIcon size={16} color="#EF4444" />
                        <span className="text-danger text-[14px] font-medium">Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* FAB */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50" style={{ maxWidth: 430 }}>
        <button
          onClick={onAddWeight}
          className="w-[60px] h-[60px] bg-accent rounded-[22px] shadow-[0_8px_28px_rgba(249,115,22,0.4)] flex items-center justify-center active:scale-90 transition-transform duration-150"
        >
          <PlusIcon size={26} color="white" />
        </button>
      </div>

      {/* Click away to close menus */}
      {expandedMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setExpandedMenu(null)} />
      )}

      {/* Settings */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        goalWeight={data.goalWeight}
        bodyFat={data.bodyFat}
        leanMass={data.leanMass}
        setGoalWeight={data.setGoalWeight}
        setBodyMetrics={data.setBodyMetrics}
        clearAll={data.clearAll}
        loadSampleData={data.loadSampleData}
        hasData={hasData}
      />

      {/* Notifications */}
      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifHook={notifHook}
      />
    </div>
  );
};

export default Dashboard;

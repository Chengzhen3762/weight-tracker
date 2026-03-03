import { useState, useEffect, useMemo, useCallback } from 'react';
import type { WeightEntry } from './useWeightData';

export type NotificationType =
  | 'reminder'
  | 'new_low'
  | 'milestone'
  | 'streak'
  | 'weekly_summary'
  | 'goal_reached'
  | 'trend_change'
  | 'first_entry'
  | 'consistency';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number; // ms
  read: boolean;
  icon: NotificationType;
  accent?: string; // color override
}

const NOTIF_KEY = 'weight-tracker-notifications-v1';
const DISMISSED_KEY = 'weight-tracker-dismissed-v1';
const REMINDER_KEY = 'weight-tracker-reminder-v1';

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function saveDismissed(s: Set<string>) {
  try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...s])); } catch { /* ignore */ }
}

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function saveReadIds(s: Set<string>) {
  try { localStorage.setItem(NOTIF_KEY, JSON.stringify([...s])); } catch { /* ignore */ }
}

export interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:MM
}

function loadReminder(): ReminderSettings {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { enabled: false, time: '07:00' };
}

function saveReminder(r: ReminderSettings) {
  try { localStorage.setItem(REMINDER_KEY, JSON.stringify(r)); } catch { /* ignore */ }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function useNotifications(
  entries: WeightEntry[],
  goalWeight: number,
  weeklyChange: number | null,
  weeklyAvg: number | null,
  progressPct: number,
  isOnTrack: boolean | null,
) {
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(loadDismissed);
  const [reminder, setReminderState] = useState<ReminderSettings>(loadReminder);

  useEffect(() => { saveReadIds(readIds); }, [readIds]);
  useEffect(() => { saveDismissed(dismissedIds); }, [dismissedIds]);
  useEffect(() => { saveReminder(reminder); }, [reminder]);

  // Generate notifications from data
  const notifications = useMemo(() => {
    const notifs: Notification[] = [];
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const today = todayStr();

    if (sorted.length === 0) return notifs;

    // --- 1. Reminder: no entry today ---
    const hasEntryToday = sorted.some(e => e.date === today);
    const now = new Date();
    const currentHour = now.getHours();

    if (!hasEntryToday && currentHour >= 6) {
      const reminderId = `reminder-${today}`;
      notifs.push({
        id: reminderId,
        type: 'reminder',
        title: 'Daily Weigh-in',
        message: currentHour < 12
          ? "Good morning! Don't forget to log your weight today."
          : currentHour < 18
          ? "You haven't logged your weight yet today."
          : "Last chance to log today's weight before the day ends!",
        timestamp: new Date(today + 'T06:00:00').getTime(),
        read: readIds.has(reminderId),
        icon: 'reminder',
      });
    }

    // --- 2. First entry celebration ---
    if (sorted.length === 1) {
      const id = 'first-entry';
      notifs.push({
        id,
        type: 'first_entry',
        title: '🎉 Journey Started!',
        message: `Great job logging your first weight at ${sorted[0].weight} lbs. Keep logging daily to see your progress!`,
        timestamp: new Date(sorted[0].date + 'T' + sorted[0].time + ':00').getTime(),
        read: readIds.has(id),
        icon: 'first_entry',
      });
    }

    // --- 3. New all-time low ---
    if (sorted.length >= 2) {
      const latest = sorted[sorted.length - 1];
      const previousWeights = sorted.slice(0, -1).map(e => e.weight);
      const previousMin = Math.min(...previousWeights);

      if (latest.weight < previousMin && latest.date === today) {
        const id = `new-low-${today}`;
        notifs.push({
          id,
          type: 'new_low',
          title: '🏆 New Low Weight!',
          message: `You hit ${latest.weight} lbs — your lowest recorded weight! That's ${(previousMin - latest.weight).toFixed(1)} lbs below your previous best.`,
          timestamp: Date.now(),
          read: readIds.has(id),
          icon: 'new_low',
          accent: '#4CAF82',
        });
      }
    }

    // --- 4. Logging streak ---
    if (sorted.length >= 2) {
      let streak = 0;
      const checkDate = new Date();
      // If no entry today, start checking from yesterday
      if (!hasEntryToday) checkDate.setDate(checkDate.getDate() - 1);

      while (true) {
        const ds = checkDate.toISOString().slice(0, 10);
        if (sorted.some(e => e.date === ds)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      if (streak >= 3) {
        const milestones = [3, 5, 7, 10, 14, 21, 30, 60, 90, 100, 180, 365];
        const hitMilestone = milestones.includes(streak);
        const id = `streak-${streak}-${today}`;

        if (hitMilestone) {
          notifs.push({
            id,
            type: 'streak',
            title: `🔥 ${streak}-Day Streak!`,
            message: streak >= 30
              ? `Incredible! ${streak} days of consistent logging. You're building an unstoppable habit!`
              : streak >= 7
              ? `${streak} days in a row! Consistency is the key to results. Keep going!`
              : `${streak} days straight! You're building a great habit.`,
            timestamp: Date.now() - 60000, // 1 min ago so it's slightly behind "today" notifs
            read: readIds.has(id),
            icon: 'streak',
            accent: '#F97316',
          });
        } else if (streak >= 3) {
          // Show generic streak notification for non-milestone streaks
          const genericId = `streak-active-${today}`;
          notifs.push({
            id: genericId,
            type: 'streak',
            title: `🔥 ${streak}-Day Streak`,
            message: `You've been logging for ${streak} days straight. Keep it up!`,
            timestamp: Date.now() - 120000,
            read: readIds.has(genericId),
            icon: 'streak',
          });
        }
      }
    }

    // --- 5. Weight loss milestones (from first entry) ---
    if (sorted.length >= 2) {
      const firstWeight = sorted[0].weight;
      const latestWeight = sorted[sorted.length - 1].weight;
      const totalLoss = firstWeight - latestWeight;

      if (totalLoss > 0) {
        const lbMilestones = [2, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
        for (const m of lbMilestones) {
          if (totalLoss >= m) {
            const id = `milestone-${m}lbs`;
            if (!dismissedIds.has(id)) {
              notifs.push({
                id,
                type: 'milestone',
                title: `🎯 ${m} lbs Lost!`,
                message: `You've lost ${totalLoss.toFixed(1)} lbs since you started at ${firstWeight} lbs. ${m >= 10 ? 'Amazing progress!' : 'Great start!'}`,
                timestamp: Date.now() - 300000,
                read: readIds.has(id),
                icon: 'milestone',
                accent: '#4CAF82',
              });
            }
          }
        }
        // Only keep the highest milestone
        const milestoneNotifs = notifs.filter(n => n.type === 'milestone');
        if (milestoneNotifs.length > 1) {
          const keep = milestoneNotifs[milestoneNotifs.length - 1];
          for (const n of milestoneNotifs) {
            if (n.id !== keep.id) {
              const idx = notifs.indexOf(n);
              if (idx > -1) notifs.splice(idx, 1);
            }
          }
        }
      }
    }

    // --- 6. Progress milestones (% to goal) ---
    const pctMilestones = [25, 50, 75, 90];
    for (const p of pctMilestones) {
      if (progressPct >= p) {
        const id = `progress-${p}pct`;
        if (!dismissedIds.has(id)) {
          notifs.push({
            id,
            type: 'milestone',
            title: p === 90 ? '🚀 Almost There!' : `📊 ${p}% to Goal!`,
            message: p >= 75
              ? `You're ${p}% of the way to your goal of ${goalWeight} lbs. The finish line is in sight!`
              : `You've completed ${p}% of your journey to ${goalWeight} lbs. Keep pushing!`,
            timestamp: Date.now() - 600000,
            read: readIds.has(id),
            icon: 'milestone',
          });
        }
      }
    }
    // Only keep highest progress milestone
    const progressNotifs = notifs.filter(n => n.id.startsWith('progress-'));
    if (progressNotifs.length > 1) {
      const keep = progressNotifs[progressNotifs.length - 1];
      for (const n of progressNotifs) {
        if (n.id !== keep.id) {
          const idx = notifs.indexOf(n);
          if (idx > -1) notifs.splice(idx, 1);
        }
      }
    }

    // --- 7. Goal reached ---
    if (sorted.length >= 2) {
      const latestWeight = sorted[sorted.length - 1].weight;
      if (latestWeight <= goalWeight) {
        const id = 'goal-reached';
        notifs.push({
          id,
          type: 'goal_reached',
          title: '🎉 Goal Weight Reached!',
          message: `Congratulations! You've reached your goal of ${goalWeight} lbs. You're now at ${latestWeight} lbs. Time to celebrate!`,
          timestamp: Date.now() - 100000,
          read: readIds.has(id),
          icon: 'goal_reached',
          accent: '#F97316',
        });
      }
    }

    // --- 8. Weekly summary (on Mondays or if 7+ entries) ---
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
    if ((dayOfWeek === 1 || dayOfWeek === 0) && sorted.length >= 3 && weeklyChange !== null && weeklyAvg !== null) {
      const id = `weekly-${daysAgo(dayOfWeek === 1 ? 0 : 0)}`;
      const direction = weeklyChange < 0 ? 'lost' : weeklyChange > 0 ? 'gained' : 'maintained';
      notifs.push({
        id,
        type: 'weekly_summary',
        title: '📋 Weekly Summary',
        message: direction === 'maintained'
          ? `This week you maintained at an average of ${weeklyAvg.toFixed(1)} lbs. Steady and consistent!`
          : `This week you ${direction} ${Math.abs(weeklyChange)} lbs. Weekly average: ${weeklyAvg.toFixed(1)} lbs.${weeklyChange < 0 ? ' Great progress!' : ' Let\'s refocus next week.'}`,
        timestamp: Date.now() - 3600000,
        read: readIds.has(id),
        icon: 'weekly_summary',
      });
    }

    // --- 9. Trend change alert ---
    if (sorted.length >= 5 && weeklyChange !== null) {
      // Check if recent trend differs from overall trend
      const recentEntries = sorted.slice(-5);
      const olderEntries = sorted.slice(-10, -5);
      if (olderEntries.length >= 3) {
        const recentAvg = recentEntries.reduce((s, e) => s + e.weight, 0) / recentEntries.length;
        const olderAvg = olderEntries.reduce((s, e) => s + e.weight, 0) / olderEntries.length;
        const trendShift = recentAvg - olderAvg;

        if (Math.abs(trendShift) >= 1) {
          const direction = trendShift < 0 ? 'downward' : 'upward';
          const id = `trend-${direction}-${today}`;
          notifs.push({
            id,
            type: 'trend_change',
            title: trendShift < 0 ? '📉 Downward Trend' : '📈 Upward Trend',
            message: trendShift < 0
              ? `Your weight is trending down by ${Math.abs(trendShift).toFixed(1)} lbs compared to last week. Keep it up!`
              : `Your weight has trended up by ${trendShift.toFixed(1)} lbs recently. Consider reviewing your plan.`,
            timestamp: Date.now() - 1800000,
            read: readIds.has(id),
            icon: 'trend_change',
            accent: trendShift < 0 ? '#4CAF82' : '#EF4444',
          });
        }
      }
    }

    // --- 10. Consistency check (missed days) ---
    if (sorted.length >= 3) {
      const yesterday = daysAgo(1);
      const twoDaysAgo = daysAgo(2);
      const hasYesterday = sorted.some(e => e.date === yesterday);
      const hasTwoDaysAgo = sorted.some(e => e.date === twoDaysAgo);

      if (!hasYesterday && !hasTwoDaysAgo && !hasEntryToday) {
        const id = `consistency-${today}`;
        notifs.push({
          id,
          type: 'consistency',
          title: '⏰ Missing Entries',
          message: "You haven't logged in a couple of days. Consistent tracking helps you stay on track, even on tough days!",
          timestamp: Date.now() - 7200000,
          read: readIds.has(id),
          icon: 'consistency',
        });
      }
    }

    // Filter out dismissed, sort by timestamp desc
    return notifs
      .filter(n => !dismissedIds.has(n.id))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, goalWeight, weeklyChange, weeklyAvg, progressPct, isOnTrack, readIds, dismissedIds]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications],
  );

  const markAsRead = useCallback((id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      return next;
    });
  }, [notifications]);

  const dismiss = useCallback((id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    const ids = notifications.map(n => n.id);
    setDismissedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, [notifications]);

  const setReminder = useCallback((settings: ReminderSettings) => {
    setReminderState(settings);

    // Request browser notification permission if enabling
    if (settings.enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Browser notification for reminder
  useEffect(() => {
    if (!reminder.enabled) return;

    const checkReminder = () => {
      const now = new Date();
      const [rh, rm] = reminder.time.split(':').map(Number);
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      if (currentH === rh && currentM === rm) {
        const hasEntryToday = entries.some(e => e.date === todayStr());
        if (!hasEntryToday && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Weight Tracker', {
            body: "Time to log your daily weight! 🏋️",
            icon: '/icon-192.svg',
          });
        }
      }
    };

    const interval = setInterval(checkReminder, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminder, entries]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAllNotifications,
    reminder,
    setReminder,
    timeAgo,
  };
}

export type NotificationsHook = ReturnType<typeof useNotifications>;

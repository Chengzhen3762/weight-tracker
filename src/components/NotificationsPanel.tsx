import React, { useState, useEffect } from 'react';
import type { NotificationsHook, Notification, NotificationType } from '../hooks/useNotifications';
import { CloseIcon } from './Icons';

/* ── Notification Icons ── */
const NotifIcon: React.FC<{ type: NotificationType; accent?: string }> = ({ type, accent }) => {
  const color = accent || {
    reminder: '#F97316',
    new_low: '#4CAF82',
    milestone: '#F97316',
    streak: '#F97316',
    weekly_summary: 'var(--color-icon-default)',
    goal_reached: '#F97316',
    trend_change: 'var(--color-icon-default)',
    first_entry: '#F97316',
    consistency: '#EAB308',
  }[type];

  const bgClass: Record<NotificationType, string> = {
    reminder: 'bg-accent-muted',
    new_low: 'bg-success-light',
    milestone: 'bg-accent-muted',
    streak: 'bg-accent-muted',
    weekly_summary: 'bg-warm-hover',
    goal_reached: 'bg-accent-muted',
    trend_change: 'bg-warm-hover',
    first_entry: 'bg-accent-muted',
    consistency: 'bg-warning-bg',
  };

  const iconPaths: Record<NotificationType, React.ReactNode> = {
    reminder: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    new_low: (
      <>
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <polyline points="17 18 23 18 23 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    milestone: (
      <>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" fill="none" />
        <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.8" fill="none" />
        <circle cx="12" cy="12" r="2" fill={color} />
      </>
    ),
    streak: (
      <path d="M12 2c0 4-4 6-4 10a4 4 0 0 0 8 0c0-4-4-6-4-10zm0 14a2 2 0 0 1-2-2c0-1 2-3 2-3s2 2 2 3a2 2 0 0 1-2 2z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    weekly_summary: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8" fill="none" />
        <line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
        <line x1="9" y1="2" x2="9" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="15" y1="2" x2="15" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
    goal_reached: (
      <>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M12 15V2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 9a6 6 0 0 0 12 0" stroke={color} strokeWidth="1.8" fill="none" />
        <rect x="8" y="18" width="8" height="4" rx="1" stroke={color} strokeWidth="1.8" fill="none" />
        <line x1="12" y1="15" x2="12" y2="18" stroke={color} strokeWidth="1.8" />
      </>
    ),
    trend_change: (
      <>
        <path d="M3 3v18h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M7 16l4-6 4 3 5-7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    first_entry: (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <polyline points="22 4 12 14.01 9 11.01" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    consistency: (
      <>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" fill="none" />
        <polyline points="12 6 12 12 16 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
  };

  return (
    <div className={`w-11 h-11 rounded-[14px] ${bgClass[type]} flex items-center justify-center flex-shrink-0`}>
      <svg width={20} height={20} viewBox="0 0 24 24">
        {iconPaths[type]}
      </svg>
    </div>
  );
};

/* ── Notification Card ── */
const NotificationCard: React.FC<{
  notification: Notification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
  timeAgo: (ts: number) => string;
  index: number;
}> = ({ notification, onRead, onDismiss, timeAgo, index }) => {
  const [dismissed, setDismissed] = useState(false);

  const handleClick = () => {
    if (!notification.read) onRead(notification.id);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  return (
    <div
      className={`transition-all duration-300 ${dismissed ? 'opacity-0 -translate-x-full h-0 mb-0 overflow-hidden' : 'opacity-100'}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        onClick={handleClick}
        className={`relative rounded-[18px] px-4 py-4 flex items-start gap-3.5 transition-all duration-200 cursor-pointer group ${
          notification.read
            ? 'bg-warm-bg/50'
            : 'bg-warm-card shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-warm-border/30'
        }`}
      >
        {/* Unread dot */}
        {!notification.read && (
          <div className="absolute top-4 left-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
        )}

        <div className="ml-2">
          <NotifIcon type={notification.icon} accent={notification.accent} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-[14px] leading-snug ${notification.read ? 'font-medium text-text-secondary' : 'font-semibold text-text-primary'}`}>
              {notification.title}
            </p>
            <span className="text-text-tertiary text-[11px] flex-shrink-0 mt-0.5">
              {timeAgo(notification.timestamp)}
            </span>
          </div>
          <p className={`text-[13px] leading-relaxed mt-1 ${notification.read ? 'text-text-tertiary' : 'text-text-secondary'}`}>
            {notification.message}
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-warm-hover transition-all flex-shrink-0 mt-0.5"
        >
          <CloseIcon size={12} color="var(--color-text-tertiary)" />
        </button>
      </div>
    </div>
  );
};

/* ── Reminder Settings ── */
const ReminderSection: React.FC<{
  reminder: NotificationsHook['reminder'];
  setReminder: NotificationsHook['setReminder'];
}> = ({ reminder, setReminder }) => {
  return (
    <div className="bg-warm-card rounded-[18px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-warm-border/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-accent-muted flex items-center justify-center">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-text-primary text-[14px] font-semibold">Daily Reminder</p>
            <p className="text-text-tertiary text-[12px]">Get notified to weigh in</p>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setReminder({ ...reminder, enabled: !reminder.enabled })}
          className={`relative w-[52px] h-[30px] rounded-full transition-colors duration-300 ${
            reminder.enabled ? 'bg-accent' : 'bg-warm-border'
          }`}
        >
          <div
            className={`absolute top-[3px] w-[24px] h-[24px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition-transform duration-300 ${
              reminder.enabled ? 'translate-x-[25px]' : 'translate-x-[3px]'
            }`}
          />
        </button>
      </div>

      {/* Time picker */}
      {reminder.enabled && (
        <div className="mt-4 pt-3 border-t border-warm-border/60 flex items-center justify-between animate-fade-in-up">
          <p className="text-text-secondary text-[13px]">Reminder time</p>
          <input
            type="time"
            value={reminder.time}
            onChange={e => setReminder({ ...reminder, time: e.target.value })}
            className="bg-input-bg rounded-xl px-3 py-2 text-text-primary text-[14px] font-semibold outline-none border border-warm-border/50 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};

/* ── Main Panel ── */
interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifHook: NotificationsHook;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose, notifHook }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss, clearAllNotifications, reminder, setReminder, timeAgo } = notifHook;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-colors duration-300 ${visible ? 'bg-black/40' : 'bg-transparent'}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-[430px] bg-warm-bg rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out max-h-[85vh] flex flex-col ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-warm-border rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 pt-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-text-primary text-[22px] font-bold">Notifications</h2>
            {unreadCount > 0 && (
              <div className="px-2.5 py-0.5 bg-accent rounded-full">
                <span className="text-white text-[12px] font-bold">{unreadCount}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-accent text-[13px] font-semibold px-3 py-1.5 rounded-xl hover:bg-accent-muted transition-colors"
              >
                Read All
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-warm-hover transition-colors"
            >
              <CloseIcon size={18} color="var(--color-text-secondary)" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 overscroll-contain">
          {/* Reminder Settings */}
          <div className="mb-5">
            <ReminderSection reminder={reminder} setReminder={setReminder} />
          </div>

          {/* Notifications List */}
          {notifications.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-text-tertiary text-[11px] font-semibold tracking-wider uppercase">Recent</p>
                {notifications.length > 2 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-text-tertiary text-[12px] font-medium hover:text-danger transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {notifications.map((notif, i) => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    onRead={markAsRead}
                    onDismiss={dismiss}
                    timeAgo={timeAgo}
                    index={i}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-[20px] bg-warm-card flex items-center justify-center mb-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-warm-border/30">
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--color-text-tertiary)' }} />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--color-text-tertiary)' }} />
                </svg>
              </div>
              <p className="text-text-primary text-[16px] font-semibold mb-1">All Caught Up!</p>
              <p className="text-text-tertiary text-[13px] max-w-[240px]">
                No new notifications. Keep logging your weight to receive insights and milestones.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;

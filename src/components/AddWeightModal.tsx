import React, { useState, useEffect, useRef } from 'react';
import type { WeightEntry } from '../hooks/useWeightData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<WeightEntry, 'id'>) => void;
  onUpdate?: (id: string, data: Omit<WeightEntry, 'id'>) => void;
  editEntry?: WeightEntry | null;
  lastWeight?: number;
}

const quickNotes = ['Morning · Fasted', 'Post-workout', 'Before bed', 'After meal', 'Evening weigh-in'];

const AddWeightModal: React.FC<Props> = ({ isOpen, onClose, onSave, onUpdate, editEntry, lastWeight }) => {
  const [weightStr, setWeightStr] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editEntry) {
        setWeightStr(editEntry.weight.toFixed(1));
        setDate(editEntry.date);
        setTime(editEntry.time);
        setNote(editEntry.note);
      } else {
        const initial = lastWeight ?? 150;
        setWeightStr(initial.toFixed(1));
        setDate(new Date().toISOString().slice(0, 10));
        const now = new Date();
        setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
        setNote('');
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
    }
  }, [isOpen, editEntry, lastWeight]);

  const weightValue = parseFloat(weightStr) || 0;

  const adjust = (delta: number) => {
    const v = Math.max(1, Math.round((weightValue + delta) * 10) / 10);
    setWeightStr(v.toFixed(1));
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (/^\d{0,4}\.?\d{0,1}$/.test(v)) {
      setWeightStr(v);
    }
  };

  const handleSave = () => {
    if (weightValue <= 0) return;
    const data = { date, weight: weightValue, note, time };
    if (editEntry && onUpdate) {
      onUpdate(editEntry.id, data);
    } else {
      onSave(data);
    }
    onClose();
  };

  const handleBackdropClick = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isOpen) return null;

  const isEditing = !!editEntry;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-colors duration-300 ${visible ? 'bg-black/40' : 'bg-transparent'}`}
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div
        className={`relative w-full max-w-[430px] bg-warm-card rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-warm-border rounded-full" />
        </div>

        <div className="px-6 pb-8 pt-2">
          <h2 className="text-text-primary text-[22px] font-bold text-center mb-6">
            {isEditing ? 'Edit Weight' : 'Log Weight'}
          </h2>

          {/* Weight Input */}
          <div className="bg-input-bg rounded-[20px] p-5 mb-5 border border-warm-border/30">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => adjust(-1)}
                className="w-11 h-11 rounded-2xl bg-warm-card shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-warm-border/40 flex items-center justify-center text-text-secondary font-bold text-[15px] active:scale-90 transition-transform"
              >
                −1
              </button>
              <button
                onClick={() => adjust(-0.1)}
                className="w-11 h-11 rounded-2xl bg-warm-card shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-warm-border/40 flex items-center justify-center text-text-secondary font-semibold text-[13px] active:scale-90 transition-transform"
              >
                −.1
              </button>
              <div className="text-center mx-1">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  value={weightStr}
                  onChange={handleWeightChange}
                  onFocus={(e) => e.target.select()}
                  className="text-text-primary text-[44px] font-bold tracking-tight text-center bg-transparent outline-none w-[130px] leading-none"
                />
                <p className="text-text-secondary text-[14px] font-medium mt-0.5">lbs</p>
              </div>
              <button
                onClick={() => adjust(0.1)}
                className="w-11 h-11 rounded-2xl bg-warm-card shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-warm-border/40 flex items-center justify-center text-text-secondary font-semibold text-[13px] active:scale-90 transition-transform"
              >
                +.1
              </button>
              <button
                onClick={() => adjust(1)}
                className="w-11 h-11 rounded-2xl bg-warm-card shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-warm-border/40 flex items-center justify-center text-text-secondary font-bold text-[15px] active:scale-90 transition-transform"
              >
                +1
              </button>
            </div>
          </div>

          {/* Quick Notes */}
          <div className="mb-5">
            <p className="text-text-tertiary text-[11px] font-semibold uppercase tracking-wider mb-2 px-1">Quick Notes</p>
            <div className="flex flex-wrap gap-2">
              {quickNotes.map((n) => (
                <button
                  key={n}
                  onClick={() => setNote(n)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
                    note === n
                      ? 'bg-accent text-white shadow-[0_2px_8px_rgba(249,115,22,0.3)]'
                      : 'bg-input-bg text-text-secondary hover:text-text-primary border border-warm-border/30'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-text-tertiary text-[11px] font-semibold uppercase tracking-wider mb-1.5 block px-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-input-bg rounded-2xl px-4 py-3 text-text-primary text-[14px] font-medium outline-none border border-warm-border/50 focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="text-text-tertiary text-[11px] font-semibold uppercase tracking-wider mb-1.5 block px-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-input-bg rounded-2xl px-4 py-3 text-text-primary text-[14px] font-medium outline-none border border-warm-border/50 focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Custom Note */}
          <div className="mb-6">
            <label className="text-text-tertiary text-[11px] font-semibold uppercase tracking-wider mb-1.5 block px-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full bg-input-bg rounded-2xl px-4 py-3 text-text-primary text-[14px] font-medium outline-none placeholder:text-text-tertiary/50 border border-warm-border/50 focus:border-accent transition-colors"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={weightValue <= 0}
            className="w-full py-4 bg-accent rounded-[20px] text-white text-[16px] font-bold shadow-[0_6px_20px_rgba(249,115,22,0.35)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:shadow-none"
          >
            {isEditing ? 'Update Weight' : 'Save Weight'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWeightModal;

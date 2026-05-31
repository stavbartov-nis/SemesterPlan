import React from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';

const DAYS      = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const ALL_HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8–20

interface Props { onNext: () => void; }

export const StepConstraints: React.FC<Props> = ({ onNext }) => {
  const { preferences, setPreferences } = usePlannerStore();

  const toggleDay = (i: number) => {
    const days = preferences.allowedDays.includes(i)
      ? preferences.allowedDays.filter(d => d !== i)
      : [...preferences.allowedDays, i].sort();
    setPreferences({ ...preferences, allowedDays: days });
  };

  const setTarget = (type: 'Mandatory' | 'Core' | 'Elective', val: string) =>
    setPreferences({
      ...preferences,
      targetCreditsByType: { ...preferences.targetCreditsByType, [type]: parseInt(val) || 0 },
    });

  const startH = parseInt(preferences.timeWindow.start.split(':')[0]);
  const endH   = parseInt(preferences.timeWindow.end.split(':')[0]);

  return (
    <div className="step-layout single-col">
      <div className="step-header">
        <h2>Time Constraints</h2>
        <p className="step-desc">Tell the planner when you're available and what you're aiming for this semester.</p>
      </div>

      {/* ── Combined availability card ── */}
      <section className="constraints-section">
        <h3>When am I available?</h3>

        {/* Day row + inline time picker */}
        <div className="availability-card">
          <div className="avail-days">
            {DAYS.map((day, i) => (
              <button
                key={day}
                className={`day-chip ${preferences.allowedDays.includes(i) ? 'on' : ''}`}
                onClick={() => toggleDay(i)}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Visual time-window bar */}
          <div className="time-bar-row">
            <span className="time-bar-label">Time window</span>
            <div className="time-bar-track">
              {ALL_HOURS.map(h => {
                const inWindow = h >= startH && h < endH;
                return (
                  <div
                    key={h}
                    className={`time-bar-seg ${inWindow ? 'in-window' : ''}`}
                    title={`${h}:00`}
                  />
                );
              })}
            </div>
            <span className="time-bar-ends">{preferences.timeWindow.start} – {preferences.timeWindow.end}</span>
          </div>

          <div className="time-inputs-row">
            <label>
              From
              <input
                type="time"
                value={preferences.timeWindow.start}
                onChange={e =>
                  setPreferences({ ...preferences, timeWindow: { ...preferences.timeWindow, start: e.target.value } })
                }
              />
            </label>
            <span className="time-sep">→</span>
            <label>
              Until
              <input
                type="time"
                value={preferences.timeWindow.end}
                onChange={e =>
                  setPreferences({ ...preferences, timeWindow: { ...preferences.timeWindow, end: e.target.value } })
                }
              />
            </label>
          </div>
        </div>
      </section>

      {/* ── Credit targets ── */}
      <section className="constraints-section">
        <h3>Credit Targets this Semester</h3>
        <p className="step-hint">How many NKZ to aim for per requirement type.</p>
        <div className="credit-targets">
          {(['Mandatory', 'Core', 'Elective'] as const).map(type => (
            <div key={type} className="credit-target-row">
              <span className={`type-badge type-${type.toLowerCase()}`}>{type}</span>
              <input
                type="number"
                value={preferences.targetCreditsByType[type]}
                onChange={e => setTarget(type, e.target.value)}
                min="0"
                max="30"
              />
              <span className="nkz-label">NKZ</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Overlap ── */}
      <section className="constraints-section">
        <h3>Overlap</h3>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={preferences.overlapPolicy.allowOverlap}
            onChange={e =>
              setPreferences({
                ...preferences,
                overlapPolicy: { ...preferences.overlapPolicy, allowOverlap: e.target.checked },
              })
            }
          />
          Allow minor schedule overlaps
        </label>
      </section>

      <button className="next-btn" onClick={onNext}>
        Generate Plans →
      </button>
    </div>
  );
};

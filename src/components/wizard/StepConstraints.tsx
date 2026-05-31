import React from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

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
      targetCreditsByType: { ...preferences.targetCreditsByType, [type]: parseInt(val) || 0 }
    });

  return (
    <div className="step-layout single-col">
      <div className="step-header">
        <h2>Time Constraints</h2>
        <p className="step-desc">Tell the planner when you're available and what you're aiming for this semester.</p>
      </div>

      <section className="constraints-section">
        <h3>Available Days</h3>
        <div className="day-chips">
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
      </section>

      <section className="constraints-section">
        <h3>Time Window</h3>
        <div className="time-row">
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
      </section>

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

      <section className="constraints-section">
        <h3>Overlap</h3>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={preferences.overlapPolicy.allowOverlap}
            onChange={e =>
              setPreferences({
                ...preferences,
                overlapPolicy: { ...preferences.overlapPolicy, allowOverlap: e.target.checked }
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

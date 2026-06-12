import React from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';

const DAYS     = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'];
const ALL_HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8–20

const TYPE_HE: Record<string, string> = {
  Mandatory: 'חובה',
  Core: 'ליבה',
  Elective: 'בחירה',
};

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
        <h2>אילוצי זמן</h2>
        <p className="step-desc">ספרי למתכנן מתי את פנויה ומה המטרות שלך לסמסטר זה.</p>
      </div>

      {/* ── כרטיס זמינות ── */}
      <section className="constraints-section">
        <h3>מתי אני פנויה?</h3>

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

          {/* סרגל חלון זמן ויזואלי */}
          <div className="time-bar-row">
            <span className="time-bar-label">חלון זמן</span>
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
              מ-
              <input
                type="time"
                value={preferences.timeWindow.start}
                onChange={e =>
                  setPreferences({ ...preferences, timeWindow: { ...preferences.timeWindow, start: e.target.value } })
                }
              />
            </label>
            <span className="time-sep">←</span>
            <label>
              עד
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

      {/* ── יעדי נקודות ── */}
      <section className="constraints-section">
        <h3>יעדי נקודות לסמסטר</h3>
        <p className="step-hint">כמה נ"ז לכוון לפי סוג דרישה.</p>
        <div className="credit-targets">
          {(['Mandatory', 'Core', 'Elective'] as const).map(type => (
            <div key={type} className="credit-target-row">
              <span className={`type-badge type-${type.toLowerCase()}`}>{TYPE_HE[type]}</span>
              <input
                type="number"
                value={preferences.targetCreditsByType[type]}
                onChange={e => setTarget(type, e.target.value)}
                min="0"
                max="30"
              />
              <span className="nkz-label">נ"ז</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── חפיפה ── */}
      <section className="constraints-section">
        <h3>חפיפה</h3>
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
          לאפשר חפיפות קטנות בלוח הזמנים
        </label>
      </section>

      <button className="next-btn" onClick={onNext}>
        ← צרי תוכניות
      </button>
    </div>
  );
};

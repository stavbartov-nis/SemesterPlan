import React from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const Settings: React.FC = () => {
  const { preferences, setPreferences } = usePlannerStore();

  const toggleDay = (dayIndex: number) => {
    const newDays = preferences.allowedDays.includes(dayIndex)
      ? preferences.allowedDays.filter(d => d !== dayIndex)
      : [...preferences.allowedDays, dayIndex].sort();
    
    setPreferences({ ...preferences, allowedDays: newDays });
  };

  return (
    <div className="settings-tab">
      <h2>Preferences</h2>
      
      <section className="settings-group">
        <h3>Allowed Days</h3>
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

      <section className="settings-group">
        <h3>Time Window</h3>
        <div className="time-inputs">
          <label>
            Start: 
            <input 
              type="time" 
              value={preferences.timeWindow.start}
              onChange={(e) => setPreferences({
                ...preferences,
                timeWindow: { ...preferences.timeWindow, start: e.target.value }
              })}
            />
          </label>
          <label>
            End: 
            <input 
              type="time" 
              value={preferences.timeWindow.end}
              onChange={(e) => setPreferences({
                ...preferences,
                timeWindow: { ...preferences.timeWindow, end: e.target.value }
              })}
            />
          </label>
        </div>
      </section>

      <section className="settings-group">
        <h3>Overlap Policy</h3>
        <label className="checkbox-label">
          <input 
            type="checkbox"
            checked={preferences.overlapPolicy.allowOverlap}
            onChange={(e) => setPreferences({
              ...preferences,
              overlapPolicy: { ...preferences.overlapPolicy, allowOverlap: e.target.checked }
            })}
          />
          Allow Overlap
        </label>
        
        {preferences.overlapPolicy.allowOverlap && (
          <label>
            Max Minutes:
            <input 
              type="number"
              value={preferences.overlapPolicy.maxOverlapMinutes}
              onChange={(e) => setPreferences({
                ...preferences,
                overlapPolicy: { ...preferences.overlapPolicy, maxOverlapMinutes: parseInt(e.target.value) || 0 }
              })}
            />
          </label>
        )}
      </section>
    </div>
  );
};

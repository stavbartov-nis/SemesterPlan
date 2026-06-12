import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { MOCK_COURSES } from '../../data/huji-mock-catalog';
import { getCourseNameHe } from '../../data/course-names-he';

interface Props { onNext: () => void; }

export const StepCompleted: React.FC<Props> = ({ onNext }) => {
  const [search, setSearch] = useState('');
  const { selectedTrack, historyCourseIds, addToHistory, removeFromHistory } = usePlannerStore();

  if (!selectedTrack) return null;

  const componentStats = selectedTrack.components.map(comp => {
    const courseIds = comp.baskets.flatMap(b => b.courseIds);
    const courses   = MOCK_COURSES.filter(c => courseIds.includes(c.id));
    const total     = courses.reduce((s, c) => s + c.credits, 0);
    const done      = courses
      .filter(c => historyCourseIds.includes(c.id))
      .reduce((s, c) => s + c.credits, 0);
    return { name: comp.name, done, total };
  });

  const totalDone  = componentStats.reduce((s, c) => s + c.done,  0);
  const totalAll   = componentStats.reduce((s, c) => s + c.total, 0);

  return (
    <div className="step-layout single-col">
      <div className="step-header">
        <h2>קורסים שהושלמו</h2>
        <p className="step-desc">
          סמן קורסים שכבר עברת. הם לא יופיעו בתוכניות שייווצרו ויחשבו להתקדמות התואר.
        </p>
      </div>

      {/* ── סרגל התקדמות כולל ── */}
      <div className="overall-progress">
        <div className="overall-progress-header">
          <span>התקדמות בתואר</span>
          <strong>{totalDone} / {totalAll} נ"ז</strong>
        </div>
        <div className="progress-bar thick">
          <div
            className="progress-fill"
            style={{ width: `${totalAll > 0 ? (totalDone / totalAll) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* ── סרגלים לפי רכיב ── */}
      <div className="component-bars">
        {componentStats.map(cs => (
          <div key={cs.name} className="comp-bar-row">
            <span className="comp-bar-label">{cs.name}</span>
            <div className="comp-bar-track">
              <div
                className="comp-bar-fill"
                style={{ width: `${cs.total > 0 ? (cs.done / cs.total) * 100 : 0}%` }}
              />
            </div>
            <span className="comp-bar-value">{cs.done}/{cs.total}</span>
          </div>
        ))}
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="חפש לפי שם או קוד…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="course-scroll-list">
        {selectedTrack.components.map(comp => {
          const rows = MOCK_COURSES.filter(c =>
            comp.baskets.some(b => b.courseIds.includes(c.id)) &&
            (search === '' ||
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.id.includes(search))
          );
          if (rows.length === 0) return null;

          return (
            <div key={comp.name}>
              <div className="group-label">{comp.name}</div>
              {rows.map(course => {
                const done = historyCourseIds.includes(course.id);
                return (
                  <label key={course.id} className={`course-row checkable ${done ? 'is-done' : ''}`}>
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={e =>
                        e.target.checked ? addToHistory(course.id) : removeFromHistory(course.id)
                      }
                    />
                    <div className="course-row-info">
                      <span className="course-row-name">{getCourseNameHe(course.id, course.name)}</span>
                      <span className="course-row-meta">
                        <span className="course-code">{course.id}</span> &nbsp;·&nbsp; {course.credits} נ"ז
                      </span>
                    </div>
                    {done && <span className="done-check">✓</span>}
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>

      <button className="next-btn" onClick={onNext}>
        ← הבא: אילוצי זמן
      </button>
    </div>
  );
};

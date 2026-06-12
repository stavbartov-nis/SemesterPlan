import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { MOCK_COURSES, COURSE_YEAR } from '../../data/huji-mock-catalog';
import { getCourseNameHe } from '../../data/course-names-he';

interface Props { onNext: () => void; }

type YearFilter = 0 | 1 | 2 | 3; // 0 = all

const YEAR_LABELS: Record<Exclude<YearFilter, 0>, string> = {
  1: "שנה א'",
  2: "שנה ב'",
  3: "שנה ג'",
};

export const StepCompleted: React.FC<Props> = ({ onNext }) => {
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<YearFilter>(0);
  const { selectedTrack, historyCourseIds, addToHistory, removeFromHistory } = usePlannerStore();

  if (!selectedTrack) return null;

  // Per-component progress against the real basket minimums (capped per
  // basket), so the totals reflect the degree's 120 נ"ז — not the sum of
  // every course that could fill a basket.
  const componentStats = selectedTrack.components.map(comp => {
    let total = 0;
    let done = 0;
    for (const b of comp.baskets) {
      const doneInBasket = MOCK_COURSES
        .filter(c => b.courseIds.includes(c.id) && historyCourseIds.includes(c.id))
        .reduce((s, c) => s + c.credits, 0);
      total += b.minCredits;
      done  += Math.min(doneInBasket, b.minCredits);
    }
    return { name: comp.name, done, total };
  });

  const totalDone  = componentStats.reduce((s, c) => s + c.done,  0);
  const totalAll   = componentStats.reduce((s, c) => s + c.total, 0);

  const componentRows = selectedTrack.components.map(comp => ({
    comp,
    rows: MOCK_COURSES.filter(c =>
      comp.baskets.some(b => b.courseIds.includes(c.id)) &&
      (yearFilter === 0 || COURSE_YEAR[c.id] === yearFilter) &&
      (search === '' ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.id.includes(search))
    ),
  }));

  const visibleIds = componentRows.flatMap(({ rows }) => rows.map(c => c.id));
  const allVisibleDone = visibleIds.length > 0 && visibleIds.every(id => historyCourseIds.includes(id));

  const markVisibleYear = () => {
    if (allVisibleDone) visibleIds.forEach(removeFromHistory);
    else visibleIds.forEach(addToHistory);
  };

  return (
    <div className="step-layout single-col">
      <div className="step-header">
        <h2>קורסים שהושלמו</h2>
        <p className="step-desc">
          סמני קורסים שכבר עברת. הם לא יופיעו בתוכניות שייווצרו ויחשבו להתקדמות התואר.
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

      {/* ── סינון לפי שנה + סימון שנה שלמה ── */}
      <div className="year-filter-row">
        <div className="avail-days">
          <button
            className={`day-chip ${yearFilter === 0 ? 'on' : ''}`}
            onClick={() => setYearFilter(0)}
          >
            הכל
          </button>
          {([1, 2, 3] as const).map(y => (
            <button
              key={y}
              className={`day-chip ${yearFilter === y ? 'on' : ''}`}
              onClick={() => setYearFilter(y)}
            >
              {YEAR_LABELS[y]}
            </button>
          ))}
        </div>
        {yearFilter !== 0 && visibleIds.length > 0 && (
          <button className="mark-year-btn" onClick={markVisibleYear}>
            {allVisibleDone
              ? `בטלי סימון ${YEAR_LABELS[yearFilter]}`
              : `סמני את כל ${YEAR_LABELS[yearFilter]} כהושלמה`}
          </button>
        )}
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="חפשי לפי שם או קוד…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="course-scroll-list">
        {componentRows.every(({ rows }) => rows.length === 0) && (search !== '' || yearFilter !== 0) && (
          <div className="empty-state">
            {search !== '' ? `לא נמצאו קורסים עבור "${search}"` : 'אין קורסים משויכים לשנה זו'}
          </div>
        )}
        {componentRows.map(({ comp, rows }) => {
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
        ← הבא: קורסים קבועים
      </button>
    </div>
  );
};

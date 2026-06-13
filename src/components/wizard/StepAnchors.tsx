import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { MOCK_COURSES, getOfferingsForSemester } from '../../data/huji-mock-catalog';
import { getCourseNameHe } from '../../data/course-names-he';

const TYPE_HE: Record<string, string> = {
  Mandatory: 'חובה',
  Core: 'ליבה',
  Elective: 'בחירה',
};

interface Props { onNext: () => void; }

export const StepAnchors: React.FC<Props> = ({ onNext }) => {
  const [search, setSearch] = useState('');
  const [freeSearch, setFreeSearch] = useState('');
  const [onlyEligible, setOnlyEligible] = useState(true);
  const {
    selectedTrack, plannedCourses, removePlannedCourse, addAnchor, historyCourseIds,
    targetSemester, setTargetSemester,
    excludedCourseIds, addExclusion, removeExclusion,
    freePickIds, addFreePick, removeFreePick,
  } = usePlannerStore();

  if (!selectedTrack) return null;

  // Only courses actually offered in the planned semester are anchorable.
  const offeredIds = new Set(getOfferingsForSemester(targetSemester).map(o => o.courseId));

  const anchored = plannedCourses.filter(pc => pc.isAnchor);

  const anchoredIds = new Set(anchored.map(pc => pc.courseId));
  const satisfiedIds = new Set([...historyCourseIds, ...anchoredIds]);

  const prereqsMet = (courseId: string) => {
    const course = MOCK_COURSES.find(c => c.id === courseId);
    if (!course || course.prerequisites.length === 0) return true;
    return course.prerequisites.every(p => satisfiedIds.has(p));
  };

  const missingPrereqs = (courseId: string): string[] => {
    const course = MOCK_COURSES.find(c => c.id === courseId);
    if (!course) return [];
    return course.prerequisites
      .filter(p => !satisfiedIds.has(p))
      .map(p => {
        const c = MOCK_COURSES.find(x => x.id === p);
        return c ? getCourseNameHe(c.id, c.name) : p;
      });
  };

  // All course IDs in the track (for free pick search exclusion)
  const trackCourseIds = new Set(
    selectedTrack.components.flatMap(c => c.baskets.flatMap(b => b.courseIds))
  );

  // Free pick search across full catalog
  const freeSearchResults = freeSearch.trim().length >= 2
    ? MOCK_COURSES.filter(c =>
        !trackCourseIds.has(c.id) &&
        !historyCourseIds.includes(c.id) &&
        !excludedCourseIds.includes(c.id) &&
        !freePickIds.includes(c.id) &&
        (c.name.toLowerCase().includes(freeSearch.toLowerCase()) ||
          (c.nameEn ?? '').toLowerCase().includes(freeSearch.toLowerCase()) ||
          c.id.includes(freeSearch))
      ).slice(0, 8)
    : [];

  const componentRows = selectedTrack.components.map(comp => ({
    comp,
    rows: comp.baskets.flatMap(b =>
      MOCK_COURSES
        .filter(c =>
          b.courseIds.includes(c.id) &&
          offeredIds.has(c.id) &&
          !historyCourseIds.includes(c.id) &&
          !excludedCourseIds.includes(c.id) &&
          (!onlyEligible || prereqsMet(c.id)) &&
          (search === '' ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.id.includes(search))
        )
        .map(c => ({ course: c, type: b.type }))
    ),
  }));

  return (
    <div className="step-layout two-col">
      {/* ── שמאל: קטלוג ── */}
      <div className="step-left">
        <div className="step-header">
          <h2>קורסים קבועים</h2>
          <p className="step-desc">נעלי קורסים שאת בטוחה שתלמדי. המתכנן תמיד ישמור אותם.</p>
        </div>

        <div className="semester-picker-row">
          <span className="semester-picker-label">מתכננת עבור:</span>
          <div className="avail-days semester-picker">
            {([['A', "סמסטר א'"], ['B', "סמסטר ב'"]] as const).map(([value, label]) => (
              <button
                key={value}
                className={`day-chip ${targetSemester === value ? 'on' : ''}`}
                onClick={() => setTargetSemester(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <input
          className="search-input"
          type="text"
          placeholder="חפשי לפי שם או קוד…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <label className="toggle-label eligible-filter">
          <input
            type="checkbox"
            checked={onlyEligible}
            onChange={e => setOnlyEligible(e.target.checked)}
          />
          הציגי רק קורסים שניתן לקחת (דרישות הקדם הושלמו)
        </label>

        <div className="course-scroll-list">
          {componentRows.every(({ rows }) => rows.length === 0) && search !== '' && (
            <div className="empty-state">לא נמצאו קורסים עבור "{search}"</div>
          )}
          {componentRows.map(({ comp, rows }) => {
            if (rows.length === 0) return null;

            return (
              <div key={comp.name}>
                <div className="group-label">{comp.name}</div>
                {rows.map(({ course, type }) => {
                  const isAnchored = anchored.some(pc => pc.courseId === course.id);
                  const missing    = missingPrereqs(course.id);
                  const hasWarning = missing.length > 0;

                  return (
                    <div
                      key={course.id}
                      className={`course-row ${isAnchored ? 'is-anchored' : ''} ${hasWarning ? 'has-warning' : ''}`}
                    >
                      <div className="course-row-info">
                        <span className="course-row-name">{getCourseNameHe(course.id, course.name)}</span>
                        <span className="course-row-meta">
                          <span className="course-code">{course.id}</span> &nbsp;·&nbsp;
                          {course.credits} נ"ז &nbsp;·&nbsp;
                          <span className={`type-badge type-${type.toLowerCase()}`}>{TYPE_HE[type] ?? type}</span>
                        </span>
                        {hasWarning && (
                          <span className="prereq-warning">
                            ⚠ דרישות קדם חסרות: {missing.join(', ')}
                          </span>
                        )}
                      </div>
                      <div className="course-row-actions">
                        <button
                          className={`anchor-btn ${isAnchored ? 'anchored' : ''}`}
                          onClick={() =>
                            isAnchored ? removePlannedCourse(course.id) : addAnchor(course.id)
                          }
                        >
                          {isAnchored ? '📌 נעול' : '+ נעלי'}
                        </button>
                        <button
                          className="exclude-btn"
                          title="הוציאי קורס זה מכל התוכניות"
                          onClick={() => addExclusion(course.id)}
                        >
                          🚫
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* ── קורסים שהוצאו ── */}
          {excludedCourseIds.length > 0 && (
            <div className="excluded-section">
              <div className="group-label excluded-label">קורסים שהוצאו ({excludedCourseIds.length})</div>
              {excludedCourseIds.map(id => {
                const course = MOCK_COURSES.find(c => c.id === id);
                if (!course) return null;
                return (
                  <div key={id} className="course-row is-excluded">
                    <div className="course-row-info">
                      <span className="course-row-name excluded-name">{getCourseNameHe(course.id, course.name)}</span>
                      <span className="course-row-meta">{course.id} · {course.credits} נ"ז</span>
                    </div>
                    <button className="unexclude-btn" onClick={() => removeExclusion(id)}>↩ החזרי</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ימין: רשימת קבועים ── */}
      <div className="step-right">
        <div className="step-header">
          <h2>
            הקורסים הקבועים שלך
            {anchored.length > 0 && <span className="count-badge">{anchored.length}</span>}
          </h2>
          <p className="step-desc">אלה ינעלו בכל תוכנית שתיווצר.</p>
        </div>

        {anchored.length === 0 ? (
          <div className="empty-state">
            אין קורסים קבועים עדיין — לחצי על&nbsp;<strong>+ נעלי</strong>&nbsp;על כל קורס.
          </div>
        ) : (
          <div className="anchor-list">
            {anchored.map(pc => {
              const course  = MOCK_COURSES.find(c => c.id === pc.courseId);
              const warning = !prereqsMet(pc.courseId);
              return (
                <div key={pc.courseId} className={`anchor-card ${warning ? 'warn' : ''}`}>
                  <div className="anchor-card-info">
                    <strong>{course ? getCourseNameHe(course.id, course.name) : ''}</strong>
                    <small><span className="course-code">{pc.courseId}</span> · {course?.credits} נ"ז</small>
                    {warning && (
                      <span className="prereq-warning small">⚠ דרישות קדם חסרות</span>
                    )}
                  </div>
                  <button className="remove-btn" onClick={() => removePlannedCourse(pc.courseId)}>✕</button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── הוספת קורס חופשי ── */}
        <div className="free-picks-section">
          <h3 className="free-picks-title">
            הוספת קורס מחוץ למסלול
            {freePickIds.length > 0 && <span className="count-badge">{freePickIds.length}</span>}
          </h3>
          <p className="step-desc">קורסים שייחשבו כבחירה בתוכניות שתיווצרנה.</p>
          <div className="free-pick-search-wrap">
            <input
              className="search-input"
              type="text"
              placeholder="חפשי כל קורס לפי שם או קוד…"
              value={freeSearch}
              onChange={e => setFreeSearch(e.target.value)}
            />
            {freeSearchResults.length > 0 && (
              <div className="free-pick-dropdown">
                {freeSearchResults.map(course => (
                  <div key={course.id} className="free-pick-result"
                    onClick={() => { addFreePick(course.id); setFreeSearch(''); }}>
                    <span className="fpr-name">{getCourseNameHe(course.id, course.name)}</span>
                    <span className="fpr-meta">{course.id} · {course.credits} נ"ז · {course.department}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {freePickIds.length > 0 && (
            <div className="free-pick-list">
              {freePickIds.map(id => {
                const course = MOCK_COURSES.find(c => c.id === id);
                if (!course) return null;
                const isAnchored = anchored.some(pc => pc.courseId === id);
                return (
                  <div key={id} className="anchor-card free-pick-card">
                    <div className="anchor-card-info">
                      <strong>{getCourseNameHe(course.id, course.name)}</strong>
                      <small>{course.id} · {course.credits} נ"ז</small>
                    </div>
                    <div className="course-row-actions">
                      <button
                        className={`anchor-btn ${isAnchored ? 'anchored' : ''}`}
                        title="נעלי קורס זה"
                        onClick={() => isAnchored ? removePlannedCourse(id) : addAnchor(id)}
                      >
                        {isAnchored ? '📌' : '📌?'}
                      </button>
                      <button className="remove-btn" onClick={() => removeFreePick(id)}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button className="next-btn" onClick={onNext}>
          ← הבא: אילוצי זמן
        </button>
      </div>
    </div>
  );
};

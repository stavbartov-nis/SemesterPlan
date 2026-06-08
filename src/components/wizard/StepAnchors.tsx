import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { MOCK_COURSES } from '../../data/huji-mock-catalog';
import { getCourseNameHe } from '../../data/course-names-he';

const TYPE_HE: Record<string, string> = {
  Mandatory: 'חובה',
  Core: 'ליבה',
  Elective: 'בחירה',
};

interface Props { onNext: () => void; }

export const StepAnchors: React.FC<Props> = ({ onNext }) => {
  const [search, setSearch] = useState('');
  const {
    selectedTrack, plannedCourses, removePlannedCourse, addAnchor, historyCourseIds,
  } = usePlannerStore();

  if (!selectedTrack) return null;

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

  return (
    <div className="step-layout two-col">
      {/* ── שמאל: קטלוג ── */}
      <div className="step-left">
        <div className="step-header">
          <h2>קורסים קבועים</h2>
          <p className="step-desc">נעל קורסים שאתה בטוח שתלמד. המתכנן תמיד ישמור אותם.</p>
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
            const rows = comp.baskets.flatMap(b =>
              MOCK_COURSES
                .filter(c =>
                  b.courseIds.includes(c.id) &&
                  !historyCourseIds.includes(c.id) &&
                  (search === '' ||
                    c.name.toLowerCase().includes(search.toLowerCase()) ||
                    c.id.includes(search))
                )
                .map(c => ({ course: c, type: b.type }))
            );
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
                          {course.credits} נ"ז &nbsp;·&nbsp;
                          <span className={`type-badge type-${type.toLowerCase()}`}>{TYPE_HE[type] ?? type}</span>
                        </span>
                        {hasWarning && (
                          <span className="prereq-warning">
                            ⚠ דרישות קדם חסרות: {missing.join(', ')}
                          </span>
                        )}
                      </div>
                      <button
                        className={`anchor-btn ${isAnchored ? 'anchored' : ''}`}
                        onClick={() =>
                          isAnchored ? removePlannedCourse(course.id) : addAnchor(course.id)
                        }
                      >
                        {isAnchored ? '📌 נעול' : '+ נעל'}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
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
            אין קורסים קבועים עדיין — לחץ על&nbsp;<strong>+ נעל</strong>&nbsp;על כל קורס.
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
                    <small>{course?.credits} נ"ז</small>
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

        <button className="next-btn" onClick={onNext}>
          ← הבא: קורסים שהושלמו
        </button>
      </div>
    </div>
  );
};

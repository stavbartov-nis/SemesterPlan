import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { suggestBundles, SuggestedBundle, Relaxation } from '../../engine/generator';
import { MOCK_COURSES, getOfferingsForSemester } from '../../data/huji-mock-catalog';
import { getCourseNameHe } from '../../data/course-names-he';
import { Calendar } from '../builder/Calendar';
import { Analysis } from '../shared/Analysis';
import { validateScheduleConflicts } from '../../engine/validation';
import { CourseOffering, UserPreferences } from '../../types';

const DAY_ABBR = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'];
const DAY_FULL = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];

const TYPE_HE: Record<string, string> = {
  Mandatory: 'חובה',
  Core: 'ליבה',
  Elective: 'בחירה',
};

function bundleActiveDays(bundle: SuggestedBundle, offerings: CourseOffering[]): Set<number> {
  const days = new Set<number>();
  bundle.courses.forEach(pc => {
    const offering = offerings.find(o => o.courseId === pc.courseId);
    if (!offering) return;
    pc.selectedGroupIds.forEach(gid => {
      offering.groups.find(g => g.id === gid)?.slots.forEach(s => days.add(s.day));
    });
  });
  return days;
}

export const StepGenerate: React.FC = () => {
  const { plannedCourses, selectedTrack, preferences, historyCourseIds, excludedCourseIds, freePickIds, setPlannedCourses, setPreferences, targetSemester } =
    usePlannerStore();

  const offerings = getOfferingsForSemester(targetSemester);

  const [bundles,     setBundles]     = useState<SuggestedBundle[]>([]);
  const [appliedId,   setAppliedId]   = useState<string | null>(null);
  const [generated,   setGenerated]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const anchors = plannedCourses.filter(pc => pc.isAnchor);

  const handleGenerate = () => {
    if (!selectedTrack) return;
    const result = suggestBundles(
      anchors, MOCK_COURSES, offerings, selectedTrack, preferences, historyCourseIds, excludedCourseIds, freePickIds
    );
    setBundles(result);
    setGenerated(true);
    setAppliedId(null);
  };

  const handleApply = (bundle: SuggestedBundle) => {
    setPlannedCourses(bundle.courses);
    setAppliedId(bundle.id);
  };

  /** Applies a relaxation patch to preferences and re-runs the generator. */
  const applyRelaxation = (r: Relaxation) => {
    const merged: UserPreferences = {
      ...preferences,
      ...r.prefsPatch,
      timeWindow: { ...preferences.timeWindow, ...(r.prefsPatch.timeWindow ?? {}) },
      overlapPolicy: { ...preferences.overlapPolicy, ...(r.prefsPatch.overlapPolicy ?? {}) },
      targetCreditsByComponent: {
        ...preferences.targetCreditsByComponent,
        ...(r.prefsPatch.targetCreditsByComponent ?? {}),
      },
    };
    setPreferences(merged);
    if (!selectedTrack) return;
    const result = suggestBundles(
      anchors, MOCK_COURSES, offerings, selectedTrack, merged, historyCourseIds, excludedCourseIds, freePickIds
    );
    setBundles(result);
    setAppliedId(null);
  };

  const conflictCount = appliedId
    ? validateScheduleConflicts(plannedCourses, offerings).conflicts.length
    : 0;

  const allBundlesEmpty =
    bundles.length > 0 &&
    (bundles.every(b => b.courses.filter(c => !c.isAnchor).length === 0) ||
      bundles.every(b => b.totalCredits === 0));

  return (
    <div className="step-generate">
      <div className="generate-main">

        {/* ── סרגל קורסים נעולים ── */}
        {anchors.length > 0 && (
          <div className="anchors-summary-bar">
            <span className="anchors-label">נעולים:</span>
            {anchors.map(pc => {
              const c = MOCK_COURSES.find(x => x.id === pc.courseId);
              return <span key={pc.courseId} className="anchor-chip">{c ? getCourseNameHe(c.id, c.name) : pc.courseId}</span>;
            })}
          </div>
        )}

        {/* ── שורת פעולה ── */}
        <div className="generate-action-row">
          <button className="generate-btn-large" onClick={handleGenerate}>
            ✨ צור תוכניות
          </button>
          {generated && !appliedId && (
            <span className="gen-meta">{bundles.length} תוכניות מוכנות — בחר אחת למטה</span>
          )}
          {appliedId && (
            <span className="gen-meta applied">
              ✅ תוכנית הוחלה
              <button className="text-btn" onClick={() => setAppliedId(null)}>שנה תוכנית</button>
            </span>
          )}
        </div>

        {/* ── סיכום מוכנות ── */}
        {!generated && (
          <div className="ready-summary">
            <h3>מוכן לייצור</h3>
            <div className="ready-items">
              <div className="ready-item">
                <span className="ready-icon">📌</span>
                <span>
                  {anchors.length === 0
                    ? 'אין קורסים קבועים — המתכנן ימלא בחופשיות'
                    : anchors.length === 1
                      ? 'קורס אחד נעול'
                      : `${anchors.length} קורסים נעולים`}
                </span>
              </div>
              <div className="ready-item">
                <span className="ready-icon">✓</span>
                <span>
                  {historyCourseIds.length === 0
                    ? 'לא סומנו קורסים שהושלמו'
                    : historyCourseIds.length === 1
                      ? 'קורס אחד שהושלם הוחרג'
                      : `${historyCourseIds.length} קורסים שהושלמו הוחרגו`}
                </span>
              </div>
              <div className="ready-item">
                <span className="ready-icon">📅</span>
                <span>
                  {preferences.allowedDays.length === 0
                    ? 'לא נבחרו ימים'
                    : preferences.allowedDays.map(d => DAY_FULL[d]).join(', ')}
                </span>
              </div>
              <div className="ready-item">
                <span className="ready-icon">⏰</span>
                <span>{preferences.timeWindow.start} – {preferences.timeWindow.end}</span>
              </div>
              <div className="ready-item">
                <span className="ready-icon">🎯</span>
                <span>
                  {Object.entries(preferences.targetCreditsByComponent)
                    .map(([compId, types]) => {
                      const parts = Object.entries(types)
                        .filter(([, v]) => v > 0)
                        .map(([k, v]) => `${v} ${TYPE_HE[k] ?? k}`)
                        .join(' · ');
                      const compName = compId === 'econ' ? 'כלכלה' : compId === 'biz' ? 'מנע"ס' : compId;
                      return parts ? `${compName}: ${parts}` : null;
                    })
                    .filter(Boolean)
                    .join(' | ') || 'לא הוגדרו יעדי נקודות'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── מצב ריק — לא נמצאו קורסים ── */}
        {generated && !appliedId && allBundlesEmpty && (
          <div className="gen-empty-state ready-summary">
            <h3>לא נמצאו קורסים מתאימים לאילוצים שבחרת — נסי להוסיף ימים פנויים או להרחיב את חלון הזמן</h3>
            <div className="ready-items">
              <div className="ready-item">
                <span className="ready-icon">📅</span>
                <span>
                  {preferences.allowedDays.length === 0
                    ? 'לא נבחרו ימים'
                    : preferences.allowedDays.length === 1
                      ? 'נבחר יום אחד בלבד'
                      : `נבחרו ${preferences.allowedDays.length} ימים`}
                </span>
              </div>
              <div className="ready-item">
                <span className="ready-icon">⏰</span>
                <span>חלון הזמן: {preferences.timeWindow.start} – {preferences.timeWindow.end}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── כרטיסי תוכניות ── */}
        {generated && !appliedId && bundles.length > 0 && !allBundlesEmpty && (
          <div className="bundles-section">
            <div className="bundles-grid-large">
              {bundles.map(bundle => {
                const activeDays = bundleActiveDays(bundle, offerings);
                return (
                  <div key={bundle.id} className="bundle-card-large">
                    <div className="bundle-card-top">
                      <h4>{bundle.name}</h4>
                      <span className="bundle-credits-badge">{bundle.totalCredits} נ"ז</span>
                    </div>

                    {/* תצוגת ימים */}
                    <div className="bundle-day-grid">
                      {DAY_ABBR.map((d, i) => (
                        <div key={i} className={`bdg-day ${activeDays.has(i) ? 'active' : ''}`}>
                          <span>{d}</span>
                          <div className="bdg-dot" />
                        </div>
                      ))}
                    </div>

                    <p className="bundle-rationale">{bundle.rationale}</p>

                    {bundle.differentiator && (
                      <div className="bundle-differentiator">↻ {bundle.differentiator}</div>
                    )}

                    {bundle.report.length > 0 && (
                      <div className="report-chips">
                        {bundle.report.map(item => (
                          <span
                            key={item.id}
                            className={`report-chip ${item.status}`}
                            title={item.detail}
                          >
                            {item.status === 'ok' ? '✓' : item.status === 'warn' ? '⚠' : '✗'} {item.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {bundle.conflicts > 0 && (
                      <div className="conflict-badge-inline">
                        {bundle.conflicts === 1
                          ? 'התנגשות אחת בלוח'
                          : `${bundle.conflicts} התנגשויות בלוח`}
                      </div>
                    )}

                    {bundle.relaxations.length > 0 && (
                      <div className="relaxations">
                        <span className="relax-label">לשיפור:</span>
                        {bundle.relaxations.map(r => (
                          <button
                            key={r.id}
                            className="relax-chip"
                            onClick={() => applyRelaxation(r)}
                            title={r.patchSummary}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <ul className="bundle-course-list">
                      {bundle.courses.map(pc => {
                        const c = MOCK_COURSES.find(x => x.id === pc.courseId);
                        return (
                          <li key={pc.courseId} className={pc.isAnchor ? 'is-anchor' : ''}>
                            {pc.isAnchor && <span className="pin">📌</span>}
                            <span className="bc-name">{c ? getCourseNameHe(c.id, c.name) : pc.courseId}</span>
                            <span className="course-code">{pc.courseId}</span>
                            <span className="bc-credits">{c?.credits} נ"ז</span>
                          </li>
                        );
                      })}
                    </ul>

                    <button className="apply-plan-btn" onClick={() => handleApply(bundle)}>
                      ← החל תוכנית זו
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── תוכנית שהוחלה / לוח זמנים ── */}
        {appliedId && (
          <div className="applied-plan">
            <div className="schedule-header">
              <h3>לוח הזמנים שלך — סמסטר {targetSemester === 'A' ? 'א׳' : 'ב׳'}</h3>
              {conflictCount > 0
                ? <span className="conflict-badge">{conflictCount === 1 ? 'התנגשות אחת' : `${conflictCount} התנגשויות`}</span>
                : <span className="no-conflict-badge">אין התנגשויות</span>
              }
            </div>
            <Calendar />
          </div>
        )}

      </div>

      {/* ── סרגל צד ניתוח ── */}
      <div className={`generate-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? 'הסתר ניתוח' : 'הצג ניתוח'}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>
        {sidebarOpen && <Analysis />}
      </div>
    </div>
  );
};

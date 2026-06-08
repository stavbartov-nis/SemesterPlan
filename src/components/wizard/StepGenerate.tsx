import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { suggestBundles, SuggestedBundle } from '../../engine/generator';
import { MOCK_COURSES, MOCK_OFFERINGS } from '../../data/huji-mock-catalog';
import { getCourseNameHe } from '../../data/course-names-he';
import { Calendar } from '../builder/Calendar';
import { Analysis } from '../shared/Analysis';
import { validateScheduleConflicts } from '../../engine/validation';

const DAY_ABBR = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'];
const DAY_FULL = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];

const TYPE_HE: Record<string, string> = {
  Mandatory: 'חובה',
  Core: 'ליבה',
  Elective: 'בחירה',
};

function bundleActiveDays(bundle: SuggestedBundle): Set<number> {
  const days = new Set<number>();
  bundle.courses.forEach(pc => {
    const offering = MOCK_OFFERINGS.find(o => o.courseId === pc.courseId);
    if (!offering) return;
    pc.selectedGroupIds.forEach(gid => {
      offering.groups.find(g => g.id === gid)?.slots.forEach(s => days.add(s.day));
    });
  });
  return days;
}

export const StepGenerate: React.FC = () => {
  const { plannedCourses, selectedTrack, preferences, historyCourseIds, setPlannedCourses } =
    usePlannerStore();

  const [bundles,     setBundles]     = useState<SuggestedBundle[]>([]);
  const [appliedId,   setAppliedId]   = useState<string | null>(null);
  const [generated,   setGenerated]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const anchors = plannedCourses.filter(pc => pc.isAnchor);

  const handleGenerate = () => {
    if (!selectedTrack) return;
    const result = suggestBundles(
      anchors, MOCK_COURSES, MOCK_OFFERINGS, selectedTrack, preferences, historyCourseIds
    );
    setBundles(result);
    setGenerated(true);
    setAppliedId(null);
  };

  const handleApply = (bundle: SuggestedBundle) => {
    setPlannedCourses(bundle.courses);
    setAppliedId(bundle.id);
  };

  const conflictCount = appliedId
    ? validateScheduleConflicts(plannedCourses, MOCK_OFFERINGS).conflicts.length
    : 0;

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
                    : `${anchors.length} קורס${anchors.length !== 1 ? 'ים' : ''} נעול${anchors.length !== 1 ? 'ים' : ''}`}
                </span>
              </div>
              <div className="ready-item">
                <span className="ready-icon">✓</span>
                <span>
                  {historyCourseIds.length === 0
                    ? 'לא סומנו קורסים שהושלמו'
                    : `${historyCourseIds.length} קורס${historyCourseIds.length !== 1 ? 'ים' : ''} שהושלמו הוחרגו`}
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
                  {Object.entries(preferences.targetCreditsByType)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => `${v} ${TYPE_HE[k] ?? k}`)
                    .join(' · ') || 'לא הוגדרו יעדי נקודות'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── כרטיסי תוכניות ── */}
        {generated && !appliedId && bundles.length > 0 && (
          <div className="bundles-section">
            <div className="bundles-grid-large">
              {bundles.map(bundle => {
                const activeDays = bundleActiveDays(bundle);
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

                    <ul className="bundle-course-list">
                      {bundle.courses.map(pc => {
                        const c = MOCK_COURSES.find(x => x.id === pc.courseId);
                        return (
                          <li key={pc.courseId} className={pc.isAnchor ? 'is-anchor' : ''}>
                            {pc.isAnchor && <span className="pin">📌</span>}
                            <span className="bc-name">{c ? getCourseNameHe(c.id, c.name) : pc.courseId}</span>
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
              <h3>לוח הזמנים שלך לסמסטר</h3>
              {conflictCount > 0
                ? <span className="conflict-badge">{conflictCount} התנגשות{conflictCount !== 1 ? 'ות' : ''}</span>
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

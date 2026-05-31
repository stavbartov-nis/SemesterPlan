import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { suggestBundles, SuggestedBundle } from '../../engine/generator';
import { MOCK_COURSES, MOCK_OFFERINGS } from '../../data/huji-mock-catalog';
import { Calendar } from '../builder/Calendar';
import { Analysis } from '../shared/Analysis';
import { validateScheduleConflicts } from '../../engine/validation';

const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'];
const DAY_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/** Returns the set of day indices that have at least one class in this bundle */
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

  const [bundles,        setBundles]        = useState<SuggestedBundle[]>([]);
  const [appliedId,      setAppliedId]      = useState<string | null>(null);
  const [generated,      setGenerated]      = useState(false);
  const [sidebarOpen,    setSidebarOpen]    = useState(true);

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

        {/* ── Anchors summary bar ── */}
        {anchors.length > 0 && (
          <div className="anchors-summary-bar">
            <span className="anchors-label">Locked in:</span>
            {anchors.map(pc => {
              const c = MOCK_COURSES.find(x => x.id === pc.courseId);
              return <span key={pc.courseId} className="anchor-chip">{c?.name}</span>;
            })}
          </div>
        )}

        {/* ── Generate action row ── */}
        <div className="generate-action-row">
          <button className="generate-btn-large" onClick={handleGenerate}>
            ✨ Generate Plans
          </button>
          {generated && !appliedId && (
            <span className="gen-meta">{bundles.length} plans ready — pick one below</span>
          )}
          {appliedId && (
            <span className="gen-meta applied">
              ✅ Plan applied
              <button className="text-btn" onClick={() => setAppliedId(null)}>Change plan</button>
            </span>
          )}
        </div>

        {/* ── Ready summary (empty state) ── */}
        {!generated && (
          <div className="ready-summary">
            <h3>Ready to generate</h3>
            <div className="ready-items">
              <div className="ready-item">
                <span className="ready-icon">📌</span>
                <span>
                  {anchors.length === 0
                    ? 'No anchors — planner will fill freely'
                    : `${anchors.length} course${anchors.length !== 1 ? 's' : ''} locked in`}
                </span>
              </div>
              <div className="ready-item">
                <span className="ready-icon">✓</span>
                <span>
                  {historyCourseIds.length === 0
                    ? 'No completed courses marked'
                    : `${historyCourseIds.length} completed course${historyCourseIds.length !== 1 ? 's' : ''} excluded`}
                </span>
              </div>
              <div className="ready-item">
                <span className="ready-icon">📅</span>
                <span>
                  {preferences.allowedDays.length === 0
                    ? 'No days selected'
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
                    .map(([k, v]) => `${v} ${k}`)
                    .join(' · ') || 'No credit targets set'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Bundle cards ── */}
        {generated && !appliedId && bundles.length > 0 && (
          <div className="bundles-section">
            <div className="bundles-grid-large">
              {bundles.map(bundle => {
                const activeDays = bundleActiveDays(bundle);
                return (
                  <div key={bundle.id} className="bundle-card-large">
                    <div className="bundle-card-top">
                      <h4>{bundle.name}</h4>
                      <span className="bundle-credits-badge">{bundle.totalCredits} NKZ</span>
                    </div>

                    {/* Mini day-grid preview */}
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
                            <span className="bc-name">{c?.name}</span>
                            <span className="bc-credits">{c?.credits} NKZ</span>
                          </li>
                        );
                      })}
                    </ul>

                    <button className="apply-plan-btn" onClick={() => handleApply(bundle)}>
                      Apply this plan →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Applied plan / calendar ── */}
        {appliedId && (
          <div className="applied-plan">
            <div className="schedule-header">
              <h3>Your Semester Schedule</h3>
              {conflictCount > 0
                ? <span className="conflict-badge">{conflictCount} conflict{conflictCount !== 1 ? 's' : ''}</span>
                : <span className="no-conflict-badge">No conflicts</span>
              }
            </div>
            <Calendar />
          </div>
        )}

      </div>

      {/* ── Collapsible analysis sidebar ── */}
      <div className={`generate-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? 'Hide analysis' : 'Show analysis'}
        >
          {sidebarOpen ? '›' : '‹'}
        </button>
        {sidebarOpen && <Analysis />}
      </div>
    </div>
  );
};

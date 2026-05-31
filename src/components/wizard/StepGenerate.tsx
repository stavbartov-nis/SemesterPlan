import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { suggestBundles, SuggestedBundle } from '../../engine/generator';
import { MOCK_COURSES, MOCK_OFFERINGS } from '../../data/huji-mock-catalog';
import { Calendar } from '../builder/Calendar';
import { Analysis } from '../shared/Analysis';
import { validateScheduleConflicts } from '../../engine/validation';

export const StepGenerate: React.FC = () => {
  const { plannedCourses, selectedTrack, preferences, historyCourseIds, setPlannedCourses } =
    usePlannerStore();

  const [bundles, setBundles] = useState<SuggestedBundle[]>([]);
  const [appliedBundleId, setAppliedBundleId] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  const anchors = plannedCourses.filter(pc => pc.isAnchor);

  const handleGenerate = () => {
    if (!selectedTrack) return;
    const result = suggestBundles(anchors, MOCK_COURSES, MOCK_OFFERINGS, selectedTrack, preferences, historyCourseIds);
    setBundles(result);
    setGenerated(true);
    setAppliedBundleId(null);
  };

  const handleApply = (bundle: SuggestedBundle) => {
    setPlannedCourses(bundle.courses);
    setAppliedBundleId(bundle.id);
  };

  const conflictCount = appliedBundleId
    ? validateScheduleConflicts(plannedCourses, MOCK_OFFERINGS).conflicts.length
    : 0;

  return (
    <div className="step-generate">
      <div className="generate-main">

        {anchors.length > 0 && (
          <div className="anchors-summary-bar">
            <span className="anchors-label">Locked in:</span>
            {anchors.map(pc => {
              const c = MOCK_COURSES.find(x => x.id === pc.courseId);
              return <span key={pc.courseId} className="anchor-chip">{c?.name}</span>;
            })}
          </div>
        )}

        <div className="generate-action-row">
          <button className="generate-btn-large" onClick={handleGenerate}>
            ✨ Generate Plans
          </button>
          {generated && !appliedBundleId && (
            <span className="gen-meta">{bundles.length} plans ready — pick one below</span>
          )}
          {appliedBundleId && (
            <span className="gen-meta applied">
              ✅ Plan applied
              <button className="text-btn" onClick={() => setAppliedBundleId(null)}>
                Change plan
              </button>
            </span>
          )}
        </div>

        {!generated && (
          <p className="generate-hint">
            {anchors.length === 0
              ? 'Tip: Go back to step 1 and anchor courses you want to keep — or just generate to see what fits your constraints.'
              : `You have ${anchors.length} anchor${anchors.length !== 1 ? 's' : ''}. Click Generate to build plans around them.`}
          </p>
        )}

        {generated && !appliedBundleId && bundles.length > 0 && (
          <div className="bundles-section">
            <div className="bundles-grid-large">
              {bundles.map(bundle => (
                <div key={bundle.id} className="bundle-card-large">
                  <div className="bundle-card-top">
                    <h4>{bundle.name}</h4>
                    <span className="bundle-credits-badge">{bundle.totalCredits} NKZ</span>
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
              ))}
            </div>
          </div>
        )}

        {appliedBundleId && (
          <div className="applied-plan">
            <div className="schedule-header">
              <h3>Your Semester Schedule</h3>
              {conflictCount > 0 && (
                <span className="conflict-badge">{conflictCount} conflict{conflictCount !== 1 ? 's' : ''}</span>
              )}
              {conflictCount === 0 && (
                <span className="no-conflict-badge">No conflicts</span>
              )}
            </div>
            <Calendar />
          </div>
        )}

      </div>

      <div className="generate-sidebar">
        <Analysis />
      </div>
    </div>
  );
};

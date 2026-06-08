import React from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { MOCK_COURSES, MOCK_OFFERINGS } from '../../data/huji-mock-catalog';
import { calculateRequirementProgress } from '../../engine/accounting';
import { validateScheduleConflicts } from '../../engine/validation';

export const Analysis: React.FC = () => {
  const { selectedTrack, plannedCourses, historyCourseIds } = usePlannerStore();

  if (!selectedTrack) return null;

  const progressReport = calculateRequirementProgress(
    plannedCourses.map(c => c.courseId),
    historyCourseIds,
    selectedTrack,
    MOCK_COURSES
  );

  const conflictReport = validateScheduleConflicts(plannedCourses, MOCK_OFFERINGS);

  return (
    <div className="analysis-sidebar">
      <h2>ניתוח</h2>

      <section className="conflicts-section">
        <h3>התנגשויות ({conflictReport.conflicts.length})</h3>
        {conflictReport.conflicts.length === 0 ? (
          <p className="no-conflicts">✅ אין חפיפות בלוח הזמנים</p>
        ) : (
          <div className="conflict-list">
            {conflictReport.conflicts.map((c, i) => (
              <div key={i} className="conflict-alert">
                חפיפה: {c.courseIdA} & {c.courseIdB}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="progress-section">
        <h3>התקדמות בתואר</h3>
        {progressReport.components.map((comp, i) => (
          <div key={i} className="component-progress">
            <h4>{comp.name}</h4>
            {comp.baskets.map(basket => (
              <div key={basket.basketId} className="basket-progress">
                <div className="basket-label">
                  <span>{basket.basketName}</span>
                  <span>{basket.currentCredits}/{basket.targetCredits}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, (basket.currentCredits / basket.targetCredits) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
        <div className="total-summary">
          <strong>סה"כ נ"ז: {progressReport.totalCredits}</strong>
        </div>
      </section>
    </div>
  );
};

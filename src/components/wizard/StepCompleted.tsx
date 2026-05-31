import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { MOCK_COURSES } from '../../data/huji-mock-catalog';

interface Props { onNext: () => void; }

export const StepCompleted: React.FC<Props> = ({ onNext }) => {
  const [search, setSearch] = useState('');
  const { selectedTrack, historyCourseIds, addToHistory, removeFromHistory } = usePlannerStore();

  if (!selectedTrack) return null;

  const allTrackCourses = MOCK_COURSES.filter(c =>
    selectedTrack.components.some(comp =>
      comp.baskets.some(b => b.courseIds.includes(c.id))
    )
  );

  const completedCredits = allTrackCourses
    .filter(c => historyCourseIds.includes(c.id))
    .reduce((sum, c) => sum + c.credits, 0);

  return (
    <div className="step-layout single-col">
      <div className="step-header">
        <h2>Completed Courses</h2>
        <p className="step-desc">
          Mark courses you've already passed. They'll be excluded from generated plans
          and count toward your degree progress.
        </p>
      </div>

      {historyCourseIds.length > 0 && (
        <div className="completed-summary">
          {historyCourseIds.length} course{historyCourseIds.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
          {completedCredits} NKZ completed
        </div>
      )}

      <input
        className="search-input"
        type="text"
        placeholder="Search by name or code..."
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
                        e.target.checked
                          ? addToHistory(course.id)
                          : removeFromHistory(course.id)
                      }
                    />
                    <div className="course-row-info">
                      <span className="course-row-name">{course.name}</span>
                      <span className="course-row-meta">{course.credits} NKZ</span>
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
        Next: Time Constraints →
      </button>
    </div>
  );
};

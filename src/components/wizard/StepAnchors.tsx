import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { MOCK_COURSES } from '../../data/huji-mock-catalog';

interface Props { onNext: () => void; }

export const StepAnchors: React.FC<Props> = ({ onNext }) => {
  const [search, setSearch] = useState('');
  const {
    selectedTrack, plannedCourses, removePlannedCourse, addAnchor, historyCourseIds
  } = usePlannerStore();

  if (!selectedTrack) return null;

  const anchored = plannedCourses.filter(pc => pc.isAnchor);

  return (
    <div className="step-layout two-col">
      <div className="step-left">
        <div className="step-header">
          <h2>Anchor Courses</h2>
          <p className="step-desc">Lock in courses you're definitely taking. The planner will always keep these.</p>
        </div>
        <input
          className="search-input"
          type="text"
          placeholder="Search by name or code..."
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
                  return (
                    <div key={course.id} className={`course-row ${isAnchored ? 'is-anchored' : ''}`}>
                      <div className="course-row-info">
                        <span className="course-row-name">{course.name}</span>
                        <span className="course-row-meta">
                          {course.credits} NKZ &nbsp;·&nbsp;
                          <span className={`type-badge type-${type.toLowerCase()}`}>{type}</span>
                        </span>
                      </div>
                      <button
                        className={`anchor-btn ${isAnchored ? 'anchored' : ''}`}
                        onClick={() =>
                          isAnchored
                            ? removePlannedCourse(course.id)
                            : addAnchor(course.id)
                        }
                      >
                        {isAnchored ? '📌 Anchored' : '+ Anchor'}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="step-right">
        <div className="step-header">
          <h2>
            Your Anchors
            {anchored.length > 0 && (
              <span className="count-badge">{anchored.length}</span>
            )}
          </h2>
          <p className="step-desc">These will be locked in every generated plan.</p>
        </div>

        {anchored.length === 0 ? (
          <div className="empty-state">
            No anchors yet — click&nbsp;<strong>+ Anchor</strong>&nbsp;on any course.
          </div>
        ) : (
          <div className="anchor-list">
            {anchored.map(pc => {
              const course = MOCK_COURSES.find(c => c.id === pc.courseId);
              return (
                <div key={pc.courseId} className="anchor-card">
                  <div className="anchor-card-info">
                    <strong>{course?.name}</strong>
                    <small>{course?.credits} NKZ</small>
                  </div>
                  <button className="remove-btn" onClick={() => removePlannedCourse(pc.courseId)}>✕</button>
                </div>
              );
            })}
          </div>
        )}

        <button className="next-btn" onClick={onNext}>
          Next: Completed Courses →
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { MOCK_COURSES } from '../../data/huji-mock-catalog';

export const History: React.FC = () => {
  const { historyCourseIds, addToHistory, removeFromHistory, selectedTrack } = usePlannerStore();

  if (!selectedTrack) return <div>Select a track first</div>;

  const trackCourseIds = Array.from(new Set(
    selectedTrack.components.flatMap(c => c.baskets.flatMap(b => b.courseIds))
  ));

  const allCourses = MOCK_COURSES.filter(c => trackCourseIds.includes(c.id));

  return (
    <div className="history-tab">
      <h2>Academic History</h2>
      <p className="hint">Mark courses you have already completed.</p>
      <div className="course-list">
        {allCourses.map(course => {
          const isCompleted = historyCourseIds.includes(course.id);

          return (
            <div key={course.id} className={`catalog-item ${isCompleted ? 'completed' : ''}`}>
              <div className="course-info">
                <strong>{course.id}</strong>
                <span>{course.name}</span>
              </div>
              <input 
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => {
                  if (e.target.checked) addToHistory(course.id);
                  else removeFromHistory(course.id);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

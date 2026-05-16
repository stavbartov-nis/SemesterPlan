import React from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { MOCK_COURSES } from '../../data/huji-mock-catalog';

export const Catalog: React.FC = () => {
  const { selectedTrack, addPlannedCourse, historyCourseIds, plannedCourses } = usePlannerStore();

  if (!selectedTrack) return <div>Select a track first</div>;

  // Flatten all course IDs from all baskets in the track
  const trackCourseIds = Array.from(new Set(
    selectedTrack.components.flatMap(c => c.baskets.flatMap(b => b.courseIds))
  ));

  const availableCourses = MOCK_COURSES.filter(c => trackCourseIds.includes(c.id));

  const handleDragStart = (e: React.DragEvent, courseId: string) => {
    e.dataTransfer.setData('text/plain', courseId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="catalog-sidebar">
      <h2>Degree Roadmap</h2>
      {selectedTrack.components.map((comp, ci) => (
        <div key={ci} className="component-group">
          <h3 className="component-title">{comp.name}</h3>
          {comp.baskets.map(basket => {
            const basketCourses = MOCK_COURSES.filter(c => basket.courseIds.includes(c.id));
            
            return (
              <div key={basket.id} className="basket-group">
                <h4 className="basket-title">{basket.name}</h4>
                <div className="course-list">
                  {basketCourses.map(course => {
                    const isPlanned = plannedCourses.some(pc => pc.courseId === course.id);
                    const isHistory = historyCourseIds.includes(course.id);
                    const isDisabled = isPlanned || isHistory;

                    return (
                      <div 
                        key={course.id} 
                        className={`catalog-item ${isDisabled ? 'disabled' : ''}`}
                        draggable={!isDisabled}
                        onDragStart={(e) => handleDragStart(e, course.id)}
                      >
                        <div className="course-info">
                          <strong>{course.id}</strong>
                          <span>{course.name}</span>
                          <small>{course.credits} NKZ</small>
                        </div>
                        <button 
                          disabled={isDisabled}
                          onClick={() => addPlannedCourse(course.id)}
                        >
                          {isPlanned ? 'Added' : isHistory ? 'Done' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

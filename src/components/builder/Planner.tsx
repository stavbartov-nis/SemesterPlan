import React from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { MOCK_COURSES, MOCK_OFFERINGS } from '../../data/huji-mock-catalog';
import { Calendar } from './Calendar';
import { BundleSuggestions } from './BundleSuggestions';

export const Planner: React.FC = () => {
  const { plannedCourses, addPlannedCourse, removePlannedCourse, toggleAnchor, updateSelectedGroups } = usePlannerStore();

  const handleGroupToggle = (courseId: string, groupId: string, isSelected: boolean) => {
    const pc = plannedCourses.find(c => c.courseId === courseId);
    if (!pc) return;

    let newGroups = [...pc.selectedGroupIds];
    if (isSelected) {
      newGroups.push(groupId);
    } else {
      newGroups = newGroups.filter(id => id !== groupId);
    }
    updateSelectedGroups(courseId, newGroups);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const courseId = e.dataTransfer.getData('text/plain');
    if (courseId) {
      addPlannedCourse(courseId);
    }
  };

  return (
    <div 
      className="planner-main"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <BundleSuggestions />
      <h2>Your Semester</h2>
      
      <div className="planned-courses-grid">
        {plannedCourses.length === 0 && <p className="drag-hint">Drag courses here or use the catalog to start.</p>}
        {plannedCourses.map(pc => {
          const course = MOCK_COURSES.find(c => c.id === pc.courseId);
          const offering = MOCK_OFFERINGS.find(o => o.courseId === pc.courseId);
          
          return (
            <div key={pc.courseId} className={`planned-card ${pc.isAnchor ? 'anchored' : ''}`}>
              <div className="card-header">
                <strong>{course?.name}</strong>
                <button onClick={() => removePlannedCourse(pc.courseId)}>×</button>
              </div>
              
              <div className="groups-list">
                {offering?.groups.map(group => (
                  <label key={group.id} className="group-toggle">
                    <input 
                      type="checkbox"
                      checked={pc.selectedGroupIds.includes(group.id)}
                      onChange={(e) => handleGroupToggle(pc.courseId, group.id, e.target.checked)}
                    />
                    {group.type} {group.id}
                  </label>
                ))}
              </div>

              <div className="card-controls">
                <label>
                  <input 
                    type="checkbox" 
                    checked={pc.isAnchor} 
                    onChange={() => toggleAnchor(pc.courseId)} 
                  /> 
                  Anchor
                </label>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="calendar-container">
        <h3>Weekly Schedule</h3>
        <Calendar />
      </div>
    </div>
  );
};

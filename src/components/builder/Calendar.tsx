import React from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { MOCK_OFFERINGS } from '../../data/huji-mock-catalog';
import { ScheduleSlot } from '../../types';
import './Calendar.css';

interface CalendarEvent {
  courseId: string;
  courseName: string;
  groupId: string;
  type: string;
  slot: ScheduleSlot;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00

export const Calendar: React.FC = () => {
  const { plannedCourses, preferences } = usePlannerStore();
  const visibleDays = DAYS
    .map((name, idx) => ({ name, idx }))
    .filter(d => preferences.allowedDays.includes(d.idx));

  // Extract all scheduled events from the current plan
  const events: CalendarEvent[] = [];
  
  plannedCourses.forEach(pc => {
    const offering = MOCK_OFFERINGS.find(o => o.courseId === pc.courseId);
    if (!offering) return;

    pc.selectedGroupIds.forEach(groupId => {
      const group = offering.groups.find(g => g.id === groupId);
      if (!group) return;

      group.slots.forEach(slot => {
        events.push({
          courseId: pc.courseId,
          courseName: pc.courseId, // simplified, should fetch real name
          groupId: group.id,
          type: group.type,
          slot
        });
      });
    });
  });

  const getEventStyle = (slot: ScheduleSlot) => {
    const [startHour, startMin] = slot.start.split(':').map(Number);
    const [endHour, endMin] = slot.end.split(':').map(Number);
    
    const startMinutes = (startHour - 8) * 60 + startMin;
    const endMinutes = (endHour - 8) * 60 + endMin;
    const duration = endMinutes - startMinutes;

    return {
      top: `${(startMinutes / 60) * 60}px`,
      height: `${(duration / 60) * 60}px`,
    };
  };

  return (
    <div className="weekly-calendar">
      <div className="time-column">
        <div className="header-cell timezone">Time</div>
        {HOURS.map(hour => (
          <div key={hour} className="time-label" style={{ height: '60px' }}>
            {hour}:00
          </div>
        ))}
      </div>
      
      {visibleDays.map(({ name: dayName, idx: dayIndex }) => (
        <div key={dayIndex} className="day-column">
          <div className="header-cell">{dayName}</div>
          <div className="day-grid" style={{ position: 'relative', height: `${HOURS.length * 60}px` }}>
            {/* Grid lines */}
            {HOURS.map(hour => (
              <div key={hour} className="grid-line" style={{ top: `${(hour - 8) * 60}px` }} />
            ))}

            {/* Events */}
            {events.filter(e => e.slot.day === dayIndex).map((event, i) => (
              <div 
                key={`${event.courseId}-${event.groupId}-${i}`} 
                className="calendar-event"
                style={getEventStyle(event.slot)}
              >
                <div className="event-title">{event.courseId}</div>
                <div className="event-type">{event.type} ({event.groupId})</div>
                <div className="event-time">{event.slot.start} - {event.slot.end}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

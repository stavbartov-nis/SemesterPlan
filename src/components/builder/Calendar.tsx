import React from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { MOCK_COURSES, MOCK_OFFERINGS } from '../../data/huji-mock-catalog';
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
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00–20:00

const TYPE_COLORS: Record<string, string> = {
  Lecture:  '#3182ce',
  Exercise: '#805ad5',
  Lab:      '#d69e2e',
  Seminar:  '#38a169',
};

export const Calendar: React.FC = () => {
  const { plannedCourses, preferences } = usePlannerStore();

  // Only show columns for allowed days
  const visibleDays = DAYS
    .map((name, idx) => ({ name, idx }))
    .filter(d => preferences.allowedDays.includes(d.idx));

  const events: CalendarEvent[] = [];

  plannedCourses.forEach(pc => {
    const offering = MOCK_OFFERINGS.find(o => o.courseId === pc.courseId);
    const course   = MOCK_COURSES.find(c => c.id === pc.courseId);
    if (!offering) return;

    pc.selectedGroupIds.forEach(groupId => {
      const group = offering.groups.find(g => g.id === groupId);
      if (!group) return;

      group.slots.forEach(slot => {
        events.push({
          courseId:   pc.courseId,
          courseName: course?.name ?? pc.courseId,
          groupId:    group.id,
          type:       group.type,
          slot,
        });
      });
    });
  });

  const getEventStyle = (slot: ScheduleSlot, type: string) => {
    const [startHour, startMin] = slot.start.split(':').map(Number);
    const [endHour,   endMin]   = slot.end.split(':').map(Number);

    const startMinutes = (startHour - 8) * 60 + startMin;
    const duration     = (endHour - 8) * 60 + endMin - startMinutes;
    const color        = TYPE_COLORS[type] ?? '#3182ce';

    return {
      top:         `${(startMinutes / 60) * 60}px`,
      height:      `${(duration     / 60) * 60}px`,
      borderColor: color,
      background:  `${color}18`,
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
            {HOURS.map(hour => (
              <div key={hour} className="grid-line" style={{ top: `${(hour - 8) * 60}px` }} />
            ))}

            {events.filter(e => e.slot.day === dayIndex).map((event, i) => (
              <div
                key={`${event.courseId}-${event.groupId}-${i}`}
                className="calendar-event"
                style={getEventStyle(event.slot, event.type)}
              >
                <div className="event-title">{event.courseName}</div>
                <div className="event-type">{event.type}</div>
                <div className="event-time">{event.slot.start}–{event.slot.end}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

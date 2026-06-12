import React from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { MOCK_COURSES, getOfferingsForSemester } from '../../data/huji-mock-catalog';
import { getCourseNameHe } from '../../data/course-names-he';
import { ScheduleSlot } from '../../types';
import './Calendar.css';

interface CalendarEvent {
  courseId: string;
  courseName: string;
  groupId: string;
  type: string;
  slot: ScheduleSlot;
}

interface PositionedEvent extends CalendarEvent {
  column: number;
  columns: number;
  conflict: boolean;
}

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00–20:00

const COURSE_COLORS = [
  '#3182ce', '#805ad5', '#d69e2e', '#38a169', '#e53e3e',
  '#dd6b20', '#319795', '#b83280', '#5a67d8', '#718096',
];

const TYPE_BORDER_STYLE: Record<string, string> = {
  Lecture:  'solid',
  Exercise: 'dashed',
  Lab:      'dotted',
  Seminar:  'dotted',
};

const TYPE_HE: Record<string, string> = {
  Lecture:  'הרצאה',
  Exercise: 'תרגיל',
  Lab:      'מעבדה',
  Seminar:  'סמינר',
};

const toMinutes = (time: string) => {
  const [hour, min] = time.split(':').map(Number);
  return hour * 60 + min;
};

// Group a day's events into clusters of time-overlapping events and assign
// each member a side-by-side column within its cluster.
const layoutDayEvents = (dayEvents: CalendarEvent[]): PositionedEvent[] => {
  const sorted = [...dayEvents].sort(
    (a, b) => toMinutes(a.slot.start) - toMinutes(b.slot.start)
  );

  const positioned: PositionedEvent[] = [];
  let cluster: CalendarEvent[] = [];
  let clusterEnd = 0;

  const flushCluster = () => {
    cluster.forEach((event, i) => {
      positioned.push({
        ...event,
        column:   i,
        columns:  cluster.length,
        conflict: cluster.length > 1,
      });
    });
    cluster = [];
  };

  sorted.forEach(event => {
    const start = toMinutes(event.slot.start);
    const end   = toMinutes(event.slot.end);

    if (cluster.length > 0 && start >= clusterEnd) flushCluster();

    cluster.push(event);
    clusterEnd = cluster.length === 1 ? end : Math.max(clusterEnd, end);
  });
  flushCluster();

  return positioned;
};

export const Calendar: React.FC = () => {
  const { plannedCourses, preferences, targetSemester } = usePlannerStore();

  const offerings = getOfferingsForSemester(targetSemester);

  const visibleDays = DAYS
    .map((name, idx) => ({ name, idx }))
    .filter(d => preferences.allowedDays.includes(d.idx));

  // Stable per-course color: index within the planned-courses order.
  const courseColors = new Map<string, string>(
    plannedCourses.map((pc, i) => [pc.courseId, COURSE_COLORS[i % COURSE_COLORS.length]])
  );

  const events: CalendarEvent[] = [];

  plannedCourses.forEach(pc => {
    const offering = offerings.find(o => o.courseId === pc.courseId);
    const course   = MOCK_COURSES.find(c => c.id === pc.courseId);
    if (!offering) return;

    pc.selectedGroupIds.forEach(groupId => {
      const group = offering.groups.find(g => g.id === groupId);
      if (!group) return;

      group.slots.forEach(slot => {
        events.push({
          courseId:   pc.courseId,
          courseName: course ? getCourseNameHe(course.id, course.name) : pc.courseId,
          groupId:    group.id,
          type:       group.type,
          slot,
        });
      });
    });
  });

  const legendCourses = plannedCourses.map(pc => {
    const course = MOCK_COURSES.find(c => c.id === pc.courseId);
    return {
      courseId: pc.courseId,
      name:     course ? getCourseNameHe(course.id, course.name) : pc.courseId,
      color:    courseColors.get(pc.courseId)!,
    };
  });

  const getEventStyle = (event: PositionedEvent): React.CSSProperties => {
    const startMinutes = toMinutes(event.slot.start) - 8 * 60;
    const duration     = toMinutes(event.slot.end) - 8 * 60 - startMinutes;
    const color        = courseColors.get(event.courseId) ?? COURSE_COLORS[0];
    const width        = 100 / event.columns;

    const style: React.CSSProperties = {
      top:              `${(startMinutes / 60) * 60}px`,
      height:           `${(duration     / 60) * 60}px`,
      insetInlineStart: `calc(${event.column * width}% + 2px)`,
      width:            `calc(${width}% - 4px)`,
      borderStyle:      TYPE_BORDER_STYLE[event.type] ?? 'solid',
    };

    // Conflicting events take their red border + striped background from CSS.
    if (!event.conflict) {
      style.borderColor = color;
      style.background  = `${color}18`;
    }

    return style;
  };

  return (
    <div className="calendar-container">
      {legendCourses.length > 0 && (
        <div className="calendar-legend">
          {legendCourses.map(c => (
            <span key={c.courseId} className="legend-chip">
              <span className="legend-dot" style={{ background: c.color }} />
              {c.name}
            </span>
          ))}
        </div>
      )}

      <div className="weekly-calendar">
        <div className="time-column">
          <div className="header-cell timezone">שעה</div>
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

              {layoutDayEvents(events.filter(e => e.slot.day === dayIndex)).map((event, i) => (
                <div
                  key={`${event.courseId}-${event.groupId}-${i}`}
                  className={`calendar-event${event.conflict ? ' conflict' : ''}`}
                  style={getEventStyle(event)}
                >
                  <div className="event-title">{event.courseName}</div>
                  <div className="event-type">{TYPE_HE[event.type] ?? event.type}</div>
                  <div className="event-time">{event.slot.start}–{event.slot.end}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

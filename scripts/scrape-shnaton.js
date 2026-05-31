/**
 * HUJI Shnaton Scraper
 *
 * Fetches real course data for Economics + Business departments from the
 * Shnaton API (shnaton.huji.ac.il) and writes it to src/data/huji-catalog-2026.json
 * in the schema expected by the app (Course[], CourseOffering[]).
 *
 * Usage: node scripts/scrape-shnaton.js
 * Requires Node 18+ (native fetch).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ────────────────────────────────────────────────────────────────

const YEAR = 2026;
const BASE_API = 'https://shnaton.huji.ac.il/api';
const BATCH_SIZE = 20; // courses per groups-with-sessions request (API rejects large batches)
const DELAY_MS = 800;  // polite delay between requests

// Departments to scrape (department code → human label used in logs)
const DEPARTMENTS = [
  { code: '321', label: 'Economics' },
  { code: '322', label: 'Business Administration' },
  { code: '343', label: 'Economics & Business (joint)' },
];

const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'huji-catalog-2026.json');

// ─── HTTP helpers ───────────────────────────────────────────────────────────

const SESSION_ID = crypto.randomUUID();

async function apiFetch(path, opts = {}) {
  const url = `${BASE_API}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Session-Id': SESSION_ID,
    ...opts.headers,
  };

  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── API wrappers ───────────────────────────────────────────────────────────

async function searchByDepartment(departmentCode) {
  return apiFetch('/courses/search-advanced?include=1', {
    method: 'POST',
    body: JSON.stringify({ year: YEAR, departmentCodes: [departmentCode] }),
  });
}

async function getGroupsWithSessions(courseIds) {
  const idList = courseIds.join(',');
  return apiFetch(`/courses/groups-with-sessions?year=${YEAR}&courseIds=${idList}`);
}

async function getPrerequisites(courseCode) {
  try {
    return apiFetch(`/courses/code/${courseCode}/requirements?year=${YEAR}`);
  } catch {
    return null;
  }
}

// ─── Transform helpers ──────────────────────────────────────────────────────

/** milliseconds-from-midnight → "HH:MM" */
function msToTime(ms) {
  if (!ms && ms !== 0) return null;
  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** API coursePeriod number → our Semester type */
function toSemester(period) {
  if (period === 1) return 'A';
  if (period === 2) return 'B';
  if (period === 3) return 'Annual';
  return 'A'; // fallback
}

/** API campus name → our Campus type */
function toCampus(campusName) {
  if (!campusName) return 'MtScopus';
  const n = campusName.toLowerCase();
  if (n.includes('scopus') || n.includes('הצופים')) return 'MtScopus';
  if (n.includes('safra') || n.includes('ספרא')) return 'Safra';
  if (n.includes('kerem') || n.includes('כרם')) return 'EinKerem';
  if (n.includes('rehovot') || n.includes('רחובות')) return 'Rehovot';
  return 'MtScopus';
}

/** API studySessionTypeName → our MeetingType */
function toMeetingType(typeName) {
  if (!typeName) return 'Lecture';
  const n = (typeName.he || typeName.en || '').toLowerCase();
  // Order matters: combined / specific patterns must come before single-word ones,
  // because Hebrew "שעור ותרגיל" (Lesson and Exercise) contains "תרגיל".
  if (n.includes('שעור ותרגיל') || n.includes('lesson and exercise')) return 'Lecture';
  if (n.includes('מעבדה') || n.includes('lab')) return 'Lab';
  if (n.includes('סמינר') || n.includes('seminar')) return 'Seminar';
  if (n.includes('תרגיל') || n.includes('exercise') || n.includes('trgil')) return 'Exercise';
  return 'Lecture';
}

/**
 * Flatten a requirements tree (OR/AND/COURSE nodes) into a flat list of
 * prerequisite course codes (strings). We take the simplest path through
 * OR nodes — just collect all leaf COURSE codes as a flat list, which is
 * conservative (may list more than strictly needed).
 */
function flattenPrereqs(node) {
  if (!node) return [];
  if (node.type === 'COURSE') return [String(node.courseCode)];
  if (node.type === 'AND' || node.type === 'OR') {
    return (node.children || []).flatMap(flattenPrereqs);
  }
  return [];
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nHUJI Shnaton Scraper — Year ${YEAR}`);
  console.log('═'.repeat(50));

  // 1. Fetch course lists for all departments
  const rawCourseMap = new Map(); // courseId → raw API course object
  for (const dept of DEPARTMENTS) {
    console.log(`\n▶ Fetching ${dept.label} (code: ${dept.code})...`);
    try {
      const results = await searchByDepartment(dept.code);
      console.log(`  ✓ ${results.length} courses`);
      for (const c of results) rawCourseMap.set(c.id, c);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
    }
    await sleep(DELAY_MS);
  }

  const allRaw = Array.from(rawCourseMap.values());
  console.log(`\n▶ Total unique courses: ${allRaw.length}`);

  // 2. Fetch schedule data in batches
  console.log('\n▶ Fetching schedule data (groups + sessions)...');
  const sessionsByCourseId = {};
  const ids = allRaw.map(c => c.id);
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    process.stdout.write(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ids.length / BATCH_SIZE)}...`);
    try {
      const data = await getGroupsWithSessions(batch);
      Object.assign(sessionsByCourseId, data);
      console.log(' ✓');
    } catch (err) {
      console.log(` ✗ ${err.message}`);
    }
    await sleep(DELAY_MS);
  }

  // 3. Fetch prerequisites for all unique course codes
  console.log('\n▶ Fetching prerequisites...');
  const prereqMap = {}; // courseCode (string) → string[]
  const codes = [...new Set(allRaw.map(c => c.code))];
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    if (i % 10 === 0) process.stdout.write(`  ${i}/${codes.length}\r`);
    try {
      const data = await getPrerequisites(code);
      if (data?.positiveRequirements) {
        const tree = typeof data.positiveRequirements === 'string'
          ? JSON.parse(data.positiveRequirements)
          : data.positiveRequirements;
        const prereqs = [...new Set(flattenPrereqs(tree))];
        if (prereqs.length) prereqMap[code] = prereqs;
      }
    } catch {
      // silent — not critical
    }
    await sleep(200);
  }
  console.log(`  ✓ Got prerequisites for ${Object.keys(prereqMap).length} courses`);

  // 4. Transform to app schema
  console.log('\n▶ Transforming to app schema...');
  const courses = [];
  const offerings = [];

  for (const raw of allRaw) {
    const code = raw.code; // 5-digit Shnaton code

    // Course object
    courses.push({
      id: code,
      name: raw.name?.he || raw.name?.en || '',
      credits: raw.academicPoints ?? 0,
      department: raw.departmentName?.en || raw.departmentName?.he || '',
      prerequisites: prereqMap[code] ?? [],
    });

    // CourseOffering — build from groups-with-sessions data
    const groups = sessionsByCourseId[raw.id] || raw.groups || [];
    if (!groups.length) continue;

    // Determine campus from first session's room
    let campus = 'MtScopus';
    for (const g of groups) {
      const sess = g.studySessions?.[0];
      if (sess?.room?.building?.campus?.name?.en) {
        campus = toCampus(sess.room.building.campus.name.en);
        break;
      }
    }

    const meetingGroups = [];
    for (const g of groups) {
      const sessions = g.studySessions || [];
      if (!sessions.length) continue;

      // Each studySession is one recurring weekly slot.
      // dayOfWeek: 0=Sunday, 1=Monday, … (confirmed from dates)
      const slots = sessions
        .filter(s => s.startTime != null && s.endTime != null)
        .map(s => ({
          day: s.dayOfWeek,
          start: msToTime(s.startTime),
          end: msToTime(s.endTime),
        }));

      if (!slots.length) continue;

      meetingGroups.push({
        id: String(g.id),
        type: toMeetingType(g.studySessionTypeName),
        slots,
      });
    }

    if (!meetingGroups.length) continue;

    offerings.push({
      courseId: code,
      semester: toSemester(raw.coursePeriod),
      campus,
      groups: meetingGroups,
    });
  }

  // 5. Save output
  const output = {
    meta: {
      year: YEAR,
      generated: new Date().toISOString(),
      departments: DEPARTMENTS.map(d => d.label),
      courseCount: courses.length,
      offeringCount: offerings.length,
    },
    courses,
    offerings,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');

  console.log('\n' + '═'.repeat(50));
  console.log(`✅ Done!`);
  console.log(`   Courses:   ${courses.length}`);
  console.log(`   Offerings: ${offerings.length} (with schedule data)`);
  console.log(`   Output:    ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});

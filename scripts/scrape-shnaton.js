/**
 * HUJI Shnaton Scraper — Bachelor's Catalog Builder
 *
 * Fetches real Bachelor's course data for Economics + Business Administration
 * from the Shnaton API (shnaton.huji.ac.il) and writes it to
 * src/data/huji-catalog-2026.json in the schema expected by the app.
 *
 * Filters:
 *   - sugToar === '001' (Bachelor's only — drops Master's and PhD courses)
 *   - isLearning === 1 (active courses only)
 *
 * Course names are Hebrew-first (matching the app's RTL UI) with English
 * kept in `nameEn`. Department names and meeting types use the API's
 * English fields. Offerings are split per semester: each group belongs to
 * one period, so a course running in both semesters yields two offerings.
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
const BATCH_SIZE = 20;
const DELAY_MS = 800;

// Departments to scrape. We only target Bachelor's-bearing departments;
// the sugToar filter below removes any Master's/PhD courses that slip in.
const DEPARTMENTS = [
  { code: '321', label: 'Economics' },                  // Faculty of Social Sciences
  { code: '322', label: 'Business Administration' },    // Business School
];

const BACHELOR_SUG_TOAR = '001';

const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'huji-catalog-2026.json');

// ─── HTTP helpers ───────────────────────────────────────────────────────────

const SESSION_ID = crypto.randomUUID();

async function apiFetch(p, opts = {}) {
  const url = `${BASE_API}${p}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Session-Id': SESSION_ID,
    ...opts.headers,
  };
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── API wrappers ───────────────────────────────────────────────────────────

async function searchByDepartment(departmentCode) {
  return apiFetch('/courses/search-advanced?include=1', {
    method: 'POST',
    body: JSON.stringify({ year: YEAR, departmentCodes: [departmentCode] }),
  });
}

async function getGroupsWithSessions(courseIds) {
  return apiFetch(
    `/courses/groups-with-sessions?year=${YEAR}&courseIds=${courseIds.join(',')}`
  );
}

async function getPrerequisites(courseCode) {
  try {
    return await apiFetch(`/courses/code/${courseCode}/requirements?year=${YEAR}`);
  } catch {
    return null;
  }
}

// ─── Transform helpers ──────────────────────────────────────────────────────

/** Prefer English; fall back to Hebrew if English is missing/empty. */
function pickEnglish(localized) {
  if (!localized) return '';
  const en = (localized.en || '').trim();
  if (en) return en;
  return (localized.he || '').trim();
}

/** Prefer Hebrew; fall back to English if Hebrew is missing/empty. */
function pickHebrew(localized) {
  if (!localized) return '';
  const he = (localized.he || '').trim();
  if (he) return he;
  return (localized.en || '').trim();
}

/** milliseconds-from-midnight → "HH:MM" */
function msToTime(ms) {
  if (ms == null) return null;
  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * GROUP-level period → our Semester type.
 *
 * NOTE: group.period uses a DIFFERENT numbering than course-level
 * coursePeriod (where 1=A, 2=B, 3=A-or-B, 4=Summer, 5=Annual).
 * Group periodName values observed in the live API:
 *   1 = "סמסטר א'", 2 = "סמסטר ב'", 3 = "סמסטר קיץ", 4 = "שנתי"
 */
function groupPeriodToSemester(period) {
  if (period === 1) return 'A';
  if (period === 2) return 'B';
  if (period === 3) return 'Summer';
  if (period === 4) return 'Annual';
  return null;
}

/** API campus name → our Campus type */
function toCampus(campusName) {
  if (!campusName) return 'MtScopus';
  const n = pickEnglish(campusName).toLowerCase();
  if (n.includes('scopus')) return 'MtScopus';
  if (n.includes('safra')) return 'Safra';
  if (n.includes('kerem')) return 'EinKerem';
  if (n.includes('rehovot')) return 'Rehovot';
  return 'MtScopus';
}

/**
 * API studySessionTypeName → our MeetingType.
 * The English names from the API are stable and unambiguous; match on them
 * first, then fall back to Hebrew if the English field is empty.
 */
function toMeetingType(typeName) {
  if (!typeName) return 'Lecture';
  const en = (typeName.en || '').toLowerCase();
  if (en === 'lesson and exercise') return 'Lecture';
  if (en === 'lesson') return 'Lecture';
  if (en === 'exercise') return 'Exercise';
  if (en === 'laboratory' || en === 'lab') return 'Lab';
  if (en === 'seminar') return 'Seminar';
  const he = typeName.he || '';
  if (he.includes('שעור ותרגיל')) return 'Lecture';
  if (he.includes('מעבדה')) return 'Lab';
  if (he.includes('סמינר')) return 'Seminar';
  if (he.includes('תרגיל')) return 'Exercise';
  return 'Lecture';
}

/**
 * Flatten a requirements tree (OR/AND/COURSE nodes) into a flat list of
 * prerequisite course codes. Conservative — collects every leaf code,
 * which may overstate requirements that are actually OR-branches.
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
  console.log(`\nHUJI Shnaton Scraper — Year ${YEAR}, Bachelor's only`);
  console.log('═'.repeat(60));

  // 1. Course lists per department, filtered to Bachelor's
  const rawCourseMap = new Map();
  const droppedByDept = {};

  for (const dept of DEPARTMENTS) {
    console.log(`\n▶ Fetching ${dept.label} (code: ${dept.code})...`);
    try {
      const results = await searchByDepartment(dept.code);
      let kept = 0;
      let dropped = 0;
      for (const c of results) {
        if (c.sugToar !== BACHELOR_SUG_TOAR) { dropped++; continue; }
        if (c.isLearning !== 1) { dropped++; continue; }
        rawCourseMap.set(c.id, c);
        kept++;
      }
      droppedByDept[dept.label] = dropped;
      console.log(`  ✓ ${kept} Bachelor's courses kept, ${dropped} dropped (Master's/PhD/inactive)`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
    }
    await sleep(DELAY_MS);
  }

  const allRaw = Array.from(rawCourseMap.values());
  console.log(`\n▶ Total unique Bachelor's courses: ${allRaw.length}`);

  // 2. Schedule data
  console.log('\n▶ Fetching schedule data (groups + sessions)...');
  const sessionsByCourseId = {};
  const ids = allRaw.map((c) => c.id);
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    process.stdout.write(
      `  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ids.length / BATCH_SIZE)}...`
    );
    try {
      const data = await getGroupsWithSessions(batch);
      Object.assign(sessionsByCourseId, data);
      console.log(' ✓');
    } catch (err) {
      console.log(` ✗ ${err.message}`);
    }
    await sleep(DELAY_MS);
  }

  // 3. Prerequisites
  console.log('\n▶ Fetching prerequisites...');
  const prereqMap = {};
  const codes = [...new Set(allRaw.map((c) => c.code))];
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
      /* silent */
    }
    await sleep(200);
  }
  console.log(`  ✓ Got prerequisites for ${Object.keys(prereqMap).length} courses`);

  // 4. Transform to app schema
  console.log('\n▶ Transforming to app schema...');
  const courses = [];
  const offerings = [];
  let noScheduleCount = 0;
  const missingSchedule = [];

  // Prereq codes that point outside the scraped catalog (e.g. math/stats
  // service courses) can never be satisfied in-app — the engine would mark
  // the course permanently unsuggestable. Keep only in-catalog prereqs.
  const knownCodes = new Set(allRaw.map((c) => c.code));

  for (const raw of allRaw) {
    const code = raw.code;

    courses.push({
      id: code,
      // Hebrew-first to match the app's Hebrew/RTL UI; English kept alongside.
      name: pickHebrew(raw.name),
      nameEn: pickEnglish(raw.name),
      credits: raw.academicPoints ?? 0,
      department: pickEnglish(raw.departmentName),
      prerequisites: (prereqMap[code] ?? []).filter((p) => knownCodes.has(p)),
      // statusCourseCode = 1 looks like a core / required-track tag,
      // 2 looks like an elective. We surface it so downstream code
      // (tracks, UI) can use it to bucket courses.
      statusCourseCode: raw.statusCourseCode ?? null,
    });

    const groups = sessionsByCourseId[raw.id] || [];
    if (!groups.length) {
      noScheduleCount++;
      missingSchedule.push({ code, name: pickEnglish(raw.name) });
      continue;
    }

    let campus = 'MtScopus';
    for (const g of groups) {
      const sess = (g.studySessions || [])[0];
      const campusName = sess?.room?.building?.campus?.name;
      if (campusName) { campus = toCampus(campusName); break; }
    }

    // A course can run in more than one semester (coursePeriod 3 = "Sem A or
    // B", 5 = Annual). Each group belongs to exactly one period, so we emit
    // one offering per semester containing only that semester's groups.
    const groupsBySemester = new Map();
    for (const g of groups) {
      const semester = groupPeriodToSemester(g.period);
      if (!semester) continue;
      const sessions = g.studySessions || [];
      const slots = sessions
        .filter((s) => s.startTime != null && s.endTime != null)
        .map((s) => ({
          day: s.dayOfWeek,
          start: msToTime(s.startTime),
          end: msToTime(s.endTime),
        }));
      if (!slots.length) continue;
      const meetingGroup = {
        id: String(g.id),
        // Shnaton group code like "1-01" — first number ties exercise
        // sections to their lecture section. Kept for future pairing logic.
        code: g.code ?? null,
        type: toMeetingType(g.studySessionTypeName),
        slots,
      };
      if (!groupsBySemester.has(semester)) groupsBySemester.set(semester, []);
      groupsBySemester.get(semester).push(meetingGroup);
    }

    if (!groupsBySemester.size) {
      noScheduleCount++;
      missingSchedule.push({ code, name: pickEnglish(raw.name) });
      continue;
    }

    for (const [semester, meetingGroups] of groupsBySemester) {
      offerings.push({
        courseId: code,
        semester,
        campus,
        groups: meetingGroups,
      });
    }
  }

  // 5. Save
  const output = {
    meta: {
      year: YEAR,
      generated: new Date().toISOString(),
      filter: { degree: "Bachelor's only (sugToar=001)" },
      departments: DEPARTMENTS.map((d) => d.label),
      courseCount: courses.length,
      offeringCount: offerings.length,
      noScheduleCount,
      droppedByDept,
      missingSchedule,
    },
    courses,
    offerings,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Done!');
  console.log(`   Bachelor courses: ${courses.length}`);
  console.log(`   With schedules:   ${offerings.length}`);
  console.log(`   No schedule:      ${noScheduleCount}`);
  console.log(`   Dropped (non-BSc): ${JSON.stringify(droppedByDept)}`);
  console.log(`   Output: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});

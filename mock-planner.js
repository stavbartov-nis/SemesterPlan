/**
 * Mock catalog + client-side filter for mock-planner.html.
 * Business & Economics: one integrated plan satisfies Economics (mandatory + core + elective)
 * and Business (mandatory + elective) simultaneously.
 */

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu"];

/**
 * @typedef {{ bucket: "mandatory" }} EconMandatory
 * @typedef {{ bucket: "core" }} EconCore
 * @typedef {{ bucket: "elective" }} EconElective
 * @typedef {{ bucket: "mandatory" }} BusMandatory
 * @typedef {{ bucket: "elective" }} BusElective
 * @typedef {{ bucket: "mandatory" | "core" | "elective" }} CsBucket
 */

/**
 * @type {Array<{
 *   id: number,
 *   name: string,
 *   credits: number,
 *   times: { d: number, s: number, e: number }[],
 *   economics?: EconMandatory | EconCore | EconElective,
 *   business?: BusMandatory | BusElective,
 *   cs?: CsBucket
 * }>}
 */
const COURSE_DB = [
    { id: 101, name: "Microeconomics", credits: 5, times: [{ d: 0, s: 10, e: 12.5 }, { d: 2, s: 10, e: 12 }], economics: { bucket: "mandatory" } },
    { id: 102, name: "Statistics I", credits: 5, times: [{ d: 1, s: 9, e: 11 }, { d: 3, s: 9, e: 10.5 }], economics: { bucket: "mandatory" } },
    { id: 304, name: "Introduction to Management", credits: 4, times: [{ d: 4, s: 10, e: 13 }], business: { bucket: "mandatory" } },
    { id: 111, name: "Macroeconomics", credits: 5, times: [{ d: 0, s: 14, e: 17 }], economics: { bucket: "core" } },
    { id: 115, name: "Econometrics", credits: 5, times: [{ d: 4, s: 8, e: 11 }], economics: { bucket: "core" } },
    { id: 113, name: "Financial Accounting", credits: 6, times: [{ d: 2, s: 14, e: 17 }], economics: { bucket: "core" }, business: { bucket: "elective" } },
    { id: 112, name: "Principles of Marketing", credits: 4, times: [{ d: 1, s: 14, e: 16 }], business: { bucket: "elective" } },
    { id: 114, name: "Organizational Behavior", credits: 3, times: [{ d: 3, s: 12, e: 15 }], business: { bucket: "elective" } },
    { id: 121, name: "Economic History of the World", credits: 3, times: [{ d: 4, s: 12, e: 14.5 }], economics: { bucket: "elective" } },
    { id: 122, name: "Python for Social Science", credits: 4, times: [{ d: 0, s: 8, e: 9.5 }, { d: 2, s: 8, e: 9.5 }], economics: { bucket: "elective" } },
    { id: 123, name: "Business Law", credits: 2, times: [{ d: 1, s: 12, e: 13.5 }], business: { bucket: "elective" } },
    { id: 130, name: "Financial Statement Analysis (sample)", credits: 4, times: [{ d: 0, s: 15, e: 18 }], economics: { bucket: "core" } },
    { id: 201, name: "Discrete math workshop", credits: 2, times: [{ d: 4, s: 14, e: 16 }], cs: { bucket: "mandatory" } },
    { id: 211, name: "Linear Algebra I", credits: 6, times: [{ d: 0, s: 13, e: 16 }, { d: 2, s: 13, e: 15 }], cs: { bucket: "core" } },
    { id: 212, name: "Introduction to Computer Science", credits: 6, times: [{ d: 1, s: 10, e: 13 }, { d: 3, s: 10, e: 12 }], cs: { bucket: "core" } },
    { id: 213, name: "Computability and Complexity", credits: 5, times: [{ d: 2, s: 10, e: 13 }], cs: { bucket: "core" } },
    { id: 221, name: "Digital Logic", credits: 5, times: [{ d: 2, s: 14, e: 17 }], cs: { bucket: "elective" } },
    { id: 222, name: "Ethics of Data", credits: 4, times: [{ d: 3, s: 14, e: 16 }], cs: { bucket: "elective" } }
];

const DEGREES = {
    be: {
        id: "be",
        label: "Business & Economics (joint plan)",
        economics: {
            mandatoryIds: [101, 102],
            defaultMinCore: 12,
            defaultMinElective: 4
        },
        business: {
            mandatoryIds: [304],
            defaultMinElective: 6
        }
    },
    cs: {
        id: "cs",
        label: "Computer Science (B.Sc.)",
        mandatoryIds: [201],
        defaultMinCore: 12,
        defaultMinElective: 4
    }
};

/**
 * @type {Array<{ degreeId: keyof typeof DEGREES, name: string, blurb: string, ids: number[] }>}
 */
const PLAN_TEMPLATES = [
    {
        degreeId: "be",
        name: "Balanced joint load",
        blurb: "Meets Economics core and electives and Business electives in one weekly timetable.",
        ids: [101, 102, 304, 111, 115, 113, 112, 121, 122, 123]
    },
    {
        degreeId: "be",
        name: "Morning-heavy",
        blurb: "Earlier slots where possible; same joint rule coverage.",
        ids: [101, 102, 304, 111, 115, 113, 114, 112, 122, 121, 123]
    },
    {
        degreeId: "be",
        name: "Accounting emphasis",
        blurb: "Uses Financial Accounting toward Economics core and Business elective at once.",
        ids: [101, 102, 304, 113, 111, 115, 112, 121, 122, 123]
    },
    {
        degreeId: "be",
        name: "Tight (overlap warning)",
        blurb: "Includes intentional overlap between Macro and Financial Statement Analysis for demo warnings.",
        ids: [101, 102, 304, 111, 130, 115, 112, 121, 122, 123]
    },
    {
        degreeId: "cs",
        name: "Classic CS stack",
        blurb: "Linear algebra, intro CS, logic, ethics.",
        ids: [201, 211, 212, 221, 222]
    },
    {
        degreeId: "cs",
        name: "Theory tilt",
        blurb: "Adds computability alongside intro and electives.",
        ids: [201, 212, 213, 222, 221]
    },
    {
        degreeId: "cs",
        name: "Thin electives",
        blurb: "Fewer elective credits on purpose to show shortfall messaging.",
        ids: [201, 211, 212, 222]
    }
];

const OVERLAP_MODE = {
    none: { label: "No overlap", maxOverlapHours: 0 },
    low: { label: "Low (up to 1h)", maxOverlapHours: 1 },
    med: { label: "Flexible (up to 3h)", maxOverlapHours: 3 }
};

function timeToFloat(t) {
    const [h, m] = t.split(":").map((x) => parseInt(x, 10));
    return h + m / 60;
}

function floatToTimeLabel(x) {
    const h = Math.floor(x);
    const m = Math.round((x - h) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function courseById(id) {
    return COURSE_DB.find((c) => c.id === id);
}

function aggregateJointBE(courses) {
    const econMandatoryDone = DEGREES.be.economics.mandatoryIds.filter((id) => courses.some((c) => c.id === id)).length;
    const busMandatoryDone = DEGREES.be.business.mandatoryIds.filter((id) => courses.some((c) => c.id === id)).length;

    let econCore = 0;
    let econElective = 0;
    let busElective = 0;

    for (const c of courses) {
        if (c.economics?.bucket === "core") econCore += c.credits;
        if (c.economics?.bucket === "elective") econElective += c.credits;
        if (c.business?.bucket === "elective") busElective += c.credits;
    }

    return {
        econMandatoryDone,
        econMandatoryTotal: DEGREES.be.economics.mandatoryIds.length,
        busMandatoryDone,
        busMandatoryTotal: DEGREES.be.business.mandatoryIds.length,
        econCore,
        econElective,
        busElective
    };
}

function jointBEOk(agg, targets) {
    const mandOk = agg.econMandatoryDone === agg.econMandatoryTotal && agg.busMandatoryDone === agg.busMandatoryTotal;
    const creditsOk =
        agg.econCore >= targets.econMinCore &&
        agg.econElective >= targets.econMinElective &&
        agg.busElective >= targets.busMinElective;
    return { mandOk, creditsOk, ok: mandOk && creditsOk };
}

function creditsByCsKind(courses) {
    return courses.reduce(
        (acc, c) => {
            const b = c.cs?.bucket;
            if (b === "core") acc.core += c.credits;
            if (b === "elective") acc.elective += c.credits;
            return acc;
        },
        { core: 0, elective: 0 }
    );
}

function totalOverlapHours(courses) {
    const slots = [];
    courses.forEach((c) => {
        c.times.forEach((t) => slots.push({ courseId: c.id, d: t.d, s: t.s, e: t.e }));
    });
    let total = 0;
    for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
            if (slots[i].courseId === slots[j].courseId) continue;
            if (slots[i].d !== slots[j].d) continue;
            const lo = Math.max(slots[i].s, slots[j].s);
            const hi = Math.min(slots[i].e, slots[j].e);
            if (hi > lo) total += hi - lo;
        }
    }
    return Math.round(total * 20) / 20;
}

function minGapViolationsHours(daySlots, bufferMin) {
    if (bufferMin <= 0) return 0;
    const bufH = bufferMin / 60;
    const sorted = [...daySlots].sort((a, b) => a.s - b.s);
    let bad = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i + 1].s - sorted[i].e;
        if (sorted[i].courseId === sorted[i + 1].courseId) continue;
        if (gap < bufH) bad += bufH - gap;
    }
    return Math.round(bad * 100) / 100;
}

function bufferViolationHours(courses, bufferMin) {
    const byDay = {};
    courses.forEach((c) => {
        c.times.forEach((t) => {
            if (!byDay[t.d]) byDay[t.d] = [];
            byDay[t.d].push({ d: t.d, s: t.s, e: t.e, courseId: c.id });
        });
    });
    return Object.values(byDay).reduce((sum, slots) => sum + minGapViolationsHours(slots, bufferMin), 0);
}

function hasAllMandatoryCs(courses, mandatoryIds) {
    const set = new Set(courses.map((c) => c.id));
    return mandatoryIds.every((id) => set.has(id));
}

function meetsCsMins(byKind, minCore, minElective) {
    return byKind.core >= minCore && byKind.elective >= minElective;
}

function planScoreBe({ jointOk, overlapHours, overlapBudget, bufferBadHours, mandOk }) {
    if (!mandOk) return 0;
    let s = 100;
    if (!jointOk) s -= 35;
    if (overlapHours > overlapBudget) s -= 40;
    s -= Math.min(30, overlapHours * 4);
    s -= Math.min(25, bufferBadHours * 10);
    return Math.max(0, Math.round(s));
}

function planScoreCs({ metCredits, overlapHours, overlapBudget, bufferBadHours, mandatoryOk }) {
    if (!mandatoryOk) return 0;
    let s = 100;
    if (!metCredits) s -= 35;
    if (overlapHours > overlapBudget) s -= 40;
    s -= Math.min(30, overlapHours * 4);
    s -= Math.min(25, bufferBadHours * 10);
    return Math.max(0, Math.round(s));
}

function getPrefs() {
    const degKey = /** @type {HTMLSelectElement} */ (document.getElementById("degree-select")).value;
    const activeDays = Array.from(document.querySelectorAll(".day-chip.on")).map((el) => parseInt(/** @type {HTMLElement} */ (el).dataset.day, 10));
    const start = timeToFloat(/** @type {HTMLInputElement} */ (document.getElementById("win-start")).value);
    const end = timeToFloat(/** @type {HTMLInputElement} */ (document.getElementById("win-end")).value);
    const overlapKey = /** @type {HTMLSelectElement} */ (document.getElementById("overlap-mode")).value;
    const overlapBudget = OVERLAP_MODE[overlapKey]?.maxOverlapHours ?? 3;
    const bufferMin = Math.max(0, parseInt(/** @type {HTMLInputElement} */ (document.getElementById("buffer-min")).value, 10) || 0);
    const maxPlans = Math.min(8, Math.max(1, parseInt(/** @type {HTMLInputElement} */ (document.getElementById("max-plans")).value, 10) || 3));

    if (degKey === "be") {
        return {
            kind: "be",
            degree: DEGREES.be,
            targets: {
                econMinCore: Math.max(0, parseInt(/** @type {HTMLInputElement} */ (document.getElementById("econ-min-core")).value, 10) || 0),
                econMinElective: Math.max(0, parseInt(/** @type {HTMLInputElement} */ (document.getElementById("econ-min-elective")).value, 10) || 0),
                busMinElective: Math.max(0, parseInt(/** @type {HTMLInputElement} */ (document.getElementById("bus-min-elective")).value, 10) || 0)
            },
            activeDays,
            start,
            end,
            overlapBudget,
            bufferMin,
            maxPlans
        };
    }

    return {
        kind: "cs",
        degree: DEGREES.cs,
        minCore: Math.max(0, parseInt(/** @type {HTMLInputElement} */ (document.getElementById("cs-min-core")).value, 10) || 0),
        minElective: Math.max(0, parseInt(/** @type {HTMLInputElement} */ (document.getElementById("cs-min-elective")).value, 10) || 0),
        activeDays,
        start,
        end,
        overlapBudget,
        bufferMin,
        maxPlans
    };
}

function courseAllowedByWindow(c, activeDays, start, end) {
    const daysOk = c.times.every((t) => activeDays.includes(t.d));
    const timeOk = c.times.every((t) => t.s >= start && t.e <= end);
    return daysOk && timeOk;
}

function generatePlans() {
    const prefs = getPrefs();
    const { activeDays, start, end, overlapBudget, bufferMin, maxPlans } = prefs;

    const allowedIds = new Set(
        COURSE_DB.filter((c) => courseAllowedByWindow(c, activeDays, start, end)).map((c) => c.id)
    );

    const out = [];

    for (const tpl of PLAN_TEMPLATES) {
        if (tpl.degreeId !== prefs.kind) continue;
        const missing = tpl.ids.filter((id) => !allowedIds.has(id));
        if (missing.length) continue;

        const courses = tpl.ids.map((id) => courseById(id)).filter(Boolean);
        const overlapHours = totalOverlapHours(courses);
        const bufferBad = bufferViolationHours(courses, bufferMin);
        const overlapOk = overlapHours <= overlapBudget;
        const bufferOk = bufferMin === 0 || bufferBad === 0;

        if (prefs.kind === "be") {
            const agg = aggregateJointBE(courses);
            const { mandOk, creditsOk, ok } = jointBEOk(agg, prefs.targets);
            const score = planScoreBe({
                jointOk: ok,
                overlapHours,
                overlapBudget,
                bufferBadHours: bufferBad,
                mandOk
            });

            out.push({
                key: tpl.name + tpl.ids.join(","),
                name: tpl.name,
                blurb: tpl.blurb,
                courses,
                kind: "be",
                agg,
                targets: prefs.targets,
                totalCredits: courses.reduce((s, c) => s + c.credits, 0),
                overlapHours,
                bufferBad,
                mandOk,
                metCredits: creditsOk,
                jointOk: ok,
                overlapOk,
                bufferOk,
                score,
                valid: mandOk && creditsOk && overlapOk && bufferOk
            });
        } else {
            const byKind = creditsByCsKind(courses);
            const mandatoryOk = hasAllMandatoryCs(courses, prefs.degree.mandatoryIds);
            const metCredits = meetsCsMins(byKind, prefs.minCore, prefs.minElective);
            const score = planScoreCs({
                metCredits,
                overlapHours,
                overlapBudget,
                bufferBadHours: bufferBad,
                mandatoryOk
            });

            out.push({
                key: tpl.name + tpl.ids.join(","),
                name: tpl.name,
                blurb: tpl.blurb,
                courses,
                kind: "cs",
                degree: prefs.degree,
                byKind,
                minCore: prefs.minCore,
                minElective: prefs.minElective,
                totalCredits: courses.reduce((s, c) => s + c.credits, 0),
                overlapHours,
                bufferBad,
                mandatoryOk,
                metCredits,
                overlapOk,
                bufferOk,
                score,
                valid: mandatoryOk && metCredits && overlapOk && bufferOk
            });
        }
    }

    out.sort((a, b) => {
        if (a.valid !== b.valid) return b.valid - a.valid;
        if (a.score !== b.score) return b.score - a.score;
        return b.totalCredits - a.totalCredits;
    });

    return out.slice(0, maxPlans);
}

function fillMandatoryList(elId, ids) {
    const ul = document.getElementById(elId);
    if (!ul) return;
    ul.innerHTML = "";
    ids.forEach((id) => {
        const c = courseById(id);
        const li = document.createElement("li");
        li.innerHTML = `<span>${c ? c.name : "Course " + id}</span><code>${id}</code>`;
        ul.appendChild(li);
    });
}

function syncDegreeDefaults() {
    const deg = /** @type {HTMLSelectElement} */ (document.getElementById("degree-select")).value;
    const panelBe = document.getElementById("panel-be");
    const panelCs = document.getElementById("panel-cs");
    const hintBe = document.getElementById("plan-hint-be");

    if (deg === "be") {
        panelBe.classList.remove("hidden");
        panelCs.classList.add("hidden");
        hintBe.hidden = false;

        const d = DEGREES.be;
        fillMandatoryList("econ-mandatory-list", d.economics.mandatoryIds);
        fillMandatoryList("bus-mandatory-list", d.business.mandatoryIds);
        /** @type {HTMLInputElement} */ (document.getElementById("econ-min-core")).value = String(d.economics.defaultMinCore);
        /** @type {HTMLInputElement} */ (document.getElementById("econ-min-elective")).value = String(d.economics.defaultMinElective);
        /** @type {HTMLInputElement} */ (document.getElementById("bus-min-elective")).value = String(d.business.defaultMinElective);
    } else {
        panelBe.classList.add("hidden");
        panelCs.classList.remove("hidden");
        hintBe.hidden = true;

        const d = DEGREES.cs;
        fillMandatoryList("cs-mandatory-list", d.mandatoryIds);
        /** @type {HTMLInputElement} */ (document.getElementById("cs-min-core")).value = String(d.defaultMinCore);
        /** @type {HTMLInputElement} */ (document.getElementById("cs-min-elective")).value = String(d.defaultMinElective);
    }
}

function renderPlans(plans) {
    const stack = document.getElementById("plan-stack");
    const count = document.getElementById("plan-count");
    if (!stack || !count) return;

    stack.innerHTML = "";
    count.textContent = String(plans.length);

    if (!plans.length) {
        stack.innerHTML =
            '<div class="empty-plans">No templates fit your allowed days and time window. Widen the window or enable more days.</div>';
        clearDetail();
        return;
    }

    plans.forEach((p, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "plan-card";
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
        btn.dataset.index = String(idx);

        const chips = [];
        if (p.kind === "be") {
            chips.push(`<span class="chip ${p.mandOk ? "ok" : "bad"}">Mandatory (both)</span>`);
            chips.push(`<span class="chip ${p.metCredits ? "ok" : "bad"}">Econ &amp; Bus credits</span>`);
        } else {
            chips.push(`<span class="chip ${p.mandatoryOk ? "ok" : "bad"}">Mandatory</span>`);
            chips.push(`<span class="chip ${p.metCredits ? "ok" : "bad"}">Core / elective</span>`);
        }
        chips.push(`<span class="chip ${p.overlapOk ? "ok" : "bad"}">Overlap</span>`);
        chips.push(`<span class="chip ${p.bufferOk ? "ok" : "bad"}">Gaps</span>`);

        btn.innerHTML = `
      <div>
        <h3>${p.name}</h3>
        <p class="blurb">${p.blurb}</p>
        <div class="chips">${chips.join("")}</div>
      </div>
      <div class="meta">
        <div class="score">${p.score}</div>
        <div class="lbl">Fit score</div>
      </div>
    `;
        btn.addEventListener("click", () => selectPlan(plans, idx));
        stack.appendChild(btn);
    });

    selectPlan(plans, 0);
}

function clearDetail() {
    const ph = document.getElementById("detail-placeholder");
    const panel = document.getElementById("detail-panel");
    if (ph) ph.style.display = "block";
    if (panel) panel.style.display = "none";
    document.querySelectorAll(".plan-card").forEach((c) => c.setAttribute("aria-selected", "false"));
}

function formatCourseRoles(c) {
    const parts = [];
    if (c.economics) {
        const b = c.economics.bucket;
        parts.push(`Economics: ${b === "mandatory" ? "mandatory" : b === "core" ? "core" : "elective"}`);
    }
    if (c.business) {
        parts.push(`Business: ${c.business.bucket === "mandatory" ? "mandatory" : "elective"}`);
    }
    if (c.cs) {
        parts.push(`CS: ${c.cs.bucket}`);
    }
    if (!parts.length) parts.push("—");
    return parts.join(" · ");
}

function selectPlan(plans, index) {
    const p = plans[index];
    if (!p) return;

    document.querySelectorAll(".plan-card").forEach((c, i) => c.setAttribute("aria-selected", i === index ? "true" : "false"));

    const ph = document.getElementById("detail-placeholder");
    const panel = document.getElementById("detail-panel");
    if (ph) ph.style.display = "none";
    if (panel) panel.style.display = "block";

    document.getElementById("detail-title").textContent = p.name;
    document.getElementById("m-credits").textContent = String(p.totalCredits);
    document.getElementById("m-overlap").textContent = `${p.overlapHours} h`;
    document.getElementById("m-buffer").textContent = p.bufferBad > 0 ? `${p.bufferBad} h` : "None";

    const ledger = document.getElementById("ledger");
    if (p.kind === "be") {
        const agg = p.agg;
        const t = p.targets;
        const econM = agg.econMandatoryDone === agg.econMandatoryTotal;
        const busM = agg.busMandatoryDone === agg.busMandatoryTotal;
        ledger.innerHTML = `
        <div class="ledger-section-label">Economics</div>
        <div class="ledger-grid ledger-grid--3">
          <div class="ledger-cell ${econM ? "met" : "short"}">
            Mandatory <strong>${agg.econMandatoryDone}/${agg.econMandatoryTotal}</strong>
            <span class="ledger-sub">courses</span>
          </div>
          <div class="ledger-cell ${agg.econCore >= t.econMinCore ? "met" : "short"}">
            Core credits <strong>${agg.econCore}/${t.econMinCore}</strong>
            <span class="ledger-sub">minimum</span>
          </div>
          <div class="ledger-cell ${agg.econElective >= t.econMinElective ? "met" : "short"}">
            Elective credits <strong>${agg.econElective}/${t.econMinElective}</strong>
            <span class="ledger-sub">minimum</span>
          </div>
        </div>
        <div class="ledger-section-label">Business</div>
        <div class="ledger-grid ledger-grid--2">
          <div class="ledger-cell ${busM ? "met" : "short"}">
            Mandatory <strong>${agg.busMandatoryDone}/${agg.busMandatoryTotal}</strong>
            <span class="ledger-sub">courses</span>
          </div>
          <div class="ledger-cell ${agg.busElective >= t.busMinElective ? "met" : "short"}">
            Elective credits <strong>${agg.busElective}/${t.busMinElective}</strong>
            <span class="ledger-sub">minimum</span>
          </div>
        </div>
      `;
    } else {
        const manCount = p.degree.mandatoryIds.length;
        const manDone = p.degree.mandatoryIds.filter((id) => p.courses.some((c) => c.id === id)).length;
        ledger.innerHTML = `
        <div class="ledger-grid ledger-grid--3">
          <div class="ledger-cell ${manDone === manCount ? "met" : "short"}">
            Mandatory <strong>${manDone}/${manCount}</strong>
            <span class="ledger-sub">courses</span>
          </div>
          <div class="ledger-cell ${p.byKind.core >= p.minCore ? "met" : "short"}">
            Core <strong>${p.byKind.core}/${p.minCore}</strong>
            <span class="ledger-sub">credits</span>
          </div>
          <div class="ledger-cell ${p.byKind.elective >= p.minElective ? "met" : "short"}">
            Elective <strong>${p.byKind.elective}/${p.minElective}</strong>
            <span class="ledger-sub">credits</span>
          </div>
        </div>
      `;
    }

    const rows = document.getElementById("course-rows");
    rows.innerHTML = "";
    p.courses.forEach((c) => {
        const times = c.times
            .map((t) => `${DAY_NAMES[t.d]} ${floatToTimeLabel(t.s)}–${floatToTimeLabel(t.e)}`)
            .join(" · ");
        const row = document.createElement("div");
        row.className = "cr";
        row.innerHTML = `<div><div>${c.name}</div><small>${times} · ${c.credits} cr · ${formatCourseRoles(c)}</small></div>`;
        rows.appendChild(row);
    });

    renderCalendar(p.courses);

    const alerts = document.getElementById("alerts");
    alerts.innerHTML = "";
    const add = (cls, html) => {
        const d = document.createElement("div");
        d.className = `alert ${cls}`;
        d.innerHTML = html;
        alerts.appendChild(d);
    };

    add("info", "Built from a <strong>dummy catalog snapshot</strong> — always verify against the official timetable and degree rules.");

    if (p.kind === "be") {
        if (!p.mandOk) add("risk", "One or more mandatory courses (Economics or Business) are missing from this bundle.");
        if (!p.metCredits) add("risk", "Economics core/elective or Business elective totals are below your configured minimums.");
    } else {
        if (!p.mandatoryOk) add("risk", "Mandatory CS courses are missing — this bundle would be invalid.");
        if (!p.metCredits) add("risk", "Core or elective credits are below your targets.");
    }
    if (!p.overlapOk) add("risk", `Timetable overlap is about ${p.overlapHours} hours, above your selected overlap budget.`);
    if (!p.bufferOk) add("risk", `Gap policy violated by roughly ${p.bufferBad} hours between classes.`);

    if (p.valid) add("info", "All hard checks in this mock pass for the dummy data.");
}

function renderCalendar(courses) {
    const cal = document.getElementById("cal");
    if (!cal) return;
    cal.innerHTML = "";

    const dayStart = 8;
    const dayEnd = 20;
    const span = dayEnd - dayStart;

    for (let d = 0; d < 5; d++) {
        const col = document.createElement("div");
        col.className = "day-col";
        const lbl = document.createElement("div");
        lbl.className = "lbl";
        lbl.textContent = DAY_NAMES[d];
        col.appendChild(lbl);

        courses.forEach((c, ci) => {
            c.times
                .filter((t) => t.d === d)
                .forEach((t) => {
                    const top = ((t.s - dayStart) / span) * 100;
                    const h = ((t.e - t.s) / span) * 100;
                    const b = document.createElement("div");
                    b.className = "block";
                    b.style.top = `${top}%`;
                    b.style.height = `${h}%`;
                    const hues = [215, 200, 175, 250, 145];
                    b.style.background = `hsl(${hues[ci % hues.length]} 55% 42%)`;
                    b.textContent = String(c.id);
                    col.appendChild(b);
                });
        });

        cal.appendChild(col);
    }
}

function runGenerate() {
    const btn = document.getElementById("btn-generate");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Running…";
    }
    window.setTimeout(() => {
        const plans = generatePlans();
        renderPlans(plans);
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Generate schedule options";
        }
    }, 420);
}

function init() {
    document.getElementById("degree-select").addEventListener("change", syncDegreeDefaults);

    document.querySelectorAll(".day-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
            chip.classList.toggle("on");
            const on = chip.classList.contains("on");
            chip.setAttribute("aria-pressed", on ? "true" : "false");
        });
    });

    document.getElementById("btn-generate").addEventListener("click", runGenerate);

    syncDegreeDefaults();
    clearDetail();
    document.getElementById("plan-count").textContent = "0";
}

document.addEventListener("DOMContentLoaded", init);

/**
 * Mock catalog — replace with API / scraper / registrar export later.
 * times: d = 0–4 (Sun–Thu), s/e = decimal hours from midnight.
 */
const COURSE_DB = [
    { id: 1, name: "Infinitesimal Calculus 1", credits: 7, type: "core", workload: 15, times: [{ d: 0, s: 8.5, e: 11.5 }, { d: 2, s: 8.5, e: 10.5 }] },
    { id: 2, name: "Intro to Computer Science", credits: 6, type: "core", workload: 12, times: [{ d: 1, s: 10, e: 13 }, { d: 3, s: 10, e: 12 }] },
    { id: 3, name: "Linear Algebra 1", credits: 6, type: "core", workload: 10, times: [{ d: 0, s: 13, e: 16 }, { d: 2, s: 13, e: 15 }] },
    { id: 4, name: "Discrete Mathematics", credits: 5, type: "core", workload: 8, times: [{ d: 1, s: 14, e: 17 }] },
    { id: 5, name: "Digital Logic Design", credits: 5, type: "core", workload: 9, times: [{ d: 2, s: 14, e: 17 }] },
    { id: 6, name: "Intro to Cognitive Science", credits: 4, type: "elective", workload: 5, times: [{ d: 4, s: 10, e: 12 }] },
    { id: 7, name: "Data Science Ethics", credits: 4, type: "elective", workload: 4, times: [{ d: 3, s: 14, e: 16 }] },
    { id: 8, name: "Academic Writing", credits: 2, type: "general", workload: 3, times: [{ d: 2, s: 17, e: 19 }] },
    { id: 9, name: "Digital Culture", credits: 2, type: "general", workload: 2, times: [{ d: 4, s: 14, e: 16 }] },
    { id: 10, name: "Probability for CS", credits: 4, type: "core", workload: 7, times: [{ d: 3, s: 8.5, e: 10.5 }] },
    { id: 11, name: "Philosophy of Mind", credits: 2, type: "elective", workload: 3, times: [{ d: 0, s: 16, e: 18 }] },
    { id: 12, name: "Israel in Middle East", credits: 2, type: "general", workload: 2, times: [{ d: 1, s: 17, e: 19 }] }
];

/** Named bundles (course ids) — mock “solver” picks from these after filters. */
const PLAN_TEMPLATES = [
    { name: "Balanced load", ids: [1, 2, 6, 8], blurb: "Strong core block + one elective + writing (general)." },
    { name: "STEM stack", ids: [3, 2, 10, 7, 9], blurb: "Linear algebra, CS, probability; ethics + digital culture." },
    { name: "Proofs & systems", ids: [4, 5, 10, 6, 12], blurb: "Discrete + logic + probability; cog sci + evening general." },
    { name: "Lighter weekdays", ids: [2, 10, 7, 11, 8], blurb: "Morning-heavy; smaller elective + writing." },
    { name: "Max core (tight)", ids: [1, 3, 2, 5], blurb: "No room for electives in this mock — use to test shortfall UI." }
];

const OVERLAP_BUDGET_HOURS = { none: 0, min: 1, mid: 3, high: 999 };

let generatedBundles = [];
let lastTargets = { core: 0, elective: 0, general: 0 };

function getTargets() {
    return {
        core: Math.max(0, parseInt(document.getElementById("target-core").value, 10) || 0),
        elective: Math.max(0, parseInt(document.getElementById("target-elective").value, 10) || 0),
        general: Math.max(0, parseInt(document.getElementById("target-general").value, 10) || 0)
    };
}

function updateTargetsLive() {
    const t = getTargets();
    const el = document.getElementById("targets-live");
    if (!el) return;
    el.textContent = `Targets: ${t.core} core · ${t.elective} elective · ${t.general} general credits`;
}

function creditsByType(courses) {
    return courses.reduce(
        (acc, c) => {
            acc[c.type] += c.credits;
            return acc;
        },
        { core: 0, elective: 0, general: 0 }
    );
}

function totalPairwiseOverlapHours(courses) {
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
    return Math.round(total * 10) / 10;
}

function creditShortfall(byType, targets) {
    return {
        core: Math.max(0, targets.core - byType.core),
        elective: Math.max(0, targets.elective - byType.elective),
        general: Math.max(0, targets.general - byType.general)
    };
}

function meetsAllCreditTargets(byType, targets) {
    return byType.core >= targets.core && byType.elective >= targets.elective && byType.general >= targets.general;
}

function fitScore(byType, targets, overlapHours, overlapBudget) {
    const short = creditShortfall(byType, targets);
    const shortPenalty = short.core * 5 + short.elective * 5 + short.general * 5;
    const overPenalty =
        byType.core + byType.elective + byType.general > targets.core + targets.elective + targets.general + 10 ? 3 : 0;
    const overlapPenalty = overlapHours > overlapBudget ? 50 : overlapHours * 2;
    return Math.max(0, 100 - shortPenalty - overPenalty - overlapPenalty);
}

function generateSuggestions() {
    lastTargets = getTargets();
    updateTargetsLive();

    const activeDays = Array.from(document.querySelectorAll(".day-chip.active")).map((chip) => parseInt(chip.dataset.day, 10));
    const startLimit = timeToFloat(document.getElementById("window-start").value);
    const endLimit = timeToFloat(document.getElementById("window-end").value);
    const overlapLevel = document.getElementById("overlap-tolerance").value;
    const overlapBudget = OVERLAP_BUDGET_HOURS[overlapLevel] ?? 3;

    const allowedCourses = COURSE_DB.filter((c) => {
        const daysOk = c.times.every((t) => activeDays.includes(t.d));
        const timeOk = c.times.every((t) => t.s >= startLimit && t.e <= endLimit);
        return daysOk && timeOk;
    });
    const allowedIds = new Set(allowedCourses.map((c) => c.id));

    const candidates = [];

    for (const tpl of PLAN_TEMPLATES) {
        const missing = tpl.ids.filter((id) => !allowedIds.has(id));
        if (missing.length) continue;

        const courses = tpl.ids.map((id) => COURSE_DB.find((c) => c.id === id));
        if (courses.some((c) => !c)) continue;

        const overlapHours = totalPairwiseOverlapHours(courses);
        if (overlapHours > overlapBudget) continue;

        const byType = creditsByType(courses);
        const totalCredits = courses.reduce((s, c) => s + c.credits, 0);
        const totalLoad = courses.reduce((s, c) => s + c.workload, 0);
        const met = meetsAllCreditTargets(byType, lastTargets);
        const score = fitScore(byType, lastTargets, overlapHours, overlapBudget);

        candidates.push({
            name: tpl.name,
            blurb: tpl.blurb,
            courses,
            byType,
            totalCredits,
            totalLoad,
            healthScore: Math.round(score),
            overlapHours,
            metTargets: met,
            isValid: true
        });
    }

    candidates.sort((a, b) => {
        if (a.metTargets !== b.metTargets) return b.metTargets - a.metTargets;
        return b.healthScore - a.healthScore;
    });

    generatedBundles = candidates.slice(0, 4);
    renderSuggestions();
}

function renderSuggestions() {
    const container = document.getElementById("suggestions-container");
    const countEl = document.getElementById("results-count");

    if (generatedBundles.length === 0) {
        container.innerHTML = `
            <div class="empty-results">
                <h3>No plans match these constraints</h3>
                <p>Widen your time window, allow more days, or raise overlap tolerance. (Mock templates are fixed.)</p>
            </div>
        `;
        countEl.innerText = "0 plans";
        document.getElementById("plan-detail-panel").style.display = "none";
        document.getElementById("empty-detail").style.display = "flex";
        return;
    }

    countEl.innerText = `${generatedBundles.length} plans`;
    container.innerHTML = generatedBundles
        .map(
            (b, idx) => `
        <div class="suggestion-card" data-idx="${idx}" role="button" tabindex="0">
            <div class="bundle-main">
                <h4>${b.name}</h4>
                <p class="bundle-blurb">${b.blurb}</p>
                <div class="bundle-credit-row">
                    ${creditPill("Core", b.byType.core, lastTargets.core)}
                    ${creditPill("Elective", b.byType.elective, lastTargets.elective)}
                    ${creditPill("General", b.byType.general, lastTargets.general)}
                </div>
                <div class="course-tags">
                    ${b.courses.map((c) => `<span class="tag">${escapeHtml(c.name.split(" ").slice(0, 2).join(" "))}</span>`).join("")}
                </div>
            </div>
            <div class="bundle-stats">
                <span class="stat-val">${b.totalCredits}</span>
                <span class="stat-lbl">Credits</span>
            </div>
            <div class="bundle-stats">
                <span class="stat-val" style="color:${getScoreColor(b.healthScore)}">${b.healthScore}%</span>
                <span class="stat-lbl">Fit</span>
            </div>
        </div>
    `
        )
        .join("");

    container.querySelectorAll(".suggestion-card").forEach((card) => {
        const idx = parseInt(card.dataset.idx, 10);
        card.addEventListener("click", () => selectBundle(idx));
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectBundle(idx);
            }
        });
    });

    selectBundle(0);
}

function creditPill(label, have, need) {
    const ok = have >= need;
    const cls = ok ? "ok" : need === 0 && have === 0 ? "ok" : "warn";
    return `<span class="credit-pill ${cls}">${label} ${have}/${need}</span>`;
}

function selectBundle(idx) {
    const b = generatedBundles[idx];
    if (!b) return;

    document.getElementById("plan-detail-panel").style.display = "block";
    document.getElementById("empty-detail").style.display = "none";

    document.querySelectorAll(".suggestion-card").forEach((c, i) => {
        c.classList.toggle("selected", i === idx);
    });

    document.getElementById("detail-header").innerHTML = `
        <h2 style="margin:0; font-size:1.1rem">${escapeHtml(b.name)}</h2>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:4px">${escapeHtml(b.blurb)}</p>
        <p style="font-size:0.72rem; color:var(--text-muted); margin-top:6px">Overlap in this bundle: <strong>${b.overlapHours}h</strong> (pairwise mock).</p>
    `;

    document.getElementById("detail-credits").innerText = b.totalCredits;
    document.getElementById("detail-load").innerText = b.totalLoad + "h";
    document.getElementById("detail-score").innerText = b.healthScore + "%";

    const short = creditShortfall(b.byType, lastTargets);
    document.getElementById("detail-credit-match").innerHTML = ["core", "elective", "general"]
        .map((key) => {
            const label = key === "core" ? "Core" : key === "elective" ? "Elective" : "General";
            const have = b.byType[key];
            const need = lastTargets[key];
            const met = have >= need;
            const shortVal = short[key];
            const cellClass = met ? "met" : shortVal > 0 ? "short" : "";
            const note = met ? "Meets target" : shortVal > 0 ? `Short by ${shortVal}` : "—";
            return `
                <div class="credit-match-cell ${cellClass}">
                    <span class="cm-type">${label}</span>
                    <span class="cm-val">${have} cr</span>
                    <div class="cm-target">Target ${need}+ · ${note}</div>
                </div>
            `;
        })
        .join("");

    const detailCourseList = document.getElementById("detail-course-list");
    detailCourseList.innerHTML = b.courses
        .map(
            (c) => `
        <div class="course-item-detail">
            <span class="course-name-detail">${escapeHtml(c.name)} <small style="font-weight:500;color:var(--text-muted)">(${c.credits} cr · ${c.type})</small></span>
            <span class="course-times-detail">${c.times.map((t) => `${getDayAbbr(t.d)} ${formatTime(t.s)}–${formatTime(t.e)}`).join(", ")}</span>
        </div>
    `
        )
        .join("");

    const cal = document.getElementById("mini-calendar");
    cal.innerHTML = [0, 1, 2, 3, 4]
        .map(
            (d) => `
        <div class="day-track">
            ${b.courses
                .flatMap((c) =>
                    c.times
                        .filter((t) => t.d === d)
                        .map((t) => {
                            const top = ((t.s - 8) / 12) * 100;
                            const height = ((t.e - t.s) / 12) * 100;
                            return `<div class="course-block" style="top:${top}%; height:${height}%" title="${escapeHtml(c.name)}">${escapeHtml(c.name[0])}</div>`;
                        })
                )
                .join("")}
        </div>
    `
        )
        .join("");

    const notes = [];
    if (!b.metTargets) notes.push({ type: "risk", msg: "This mock bundle does not meet all credit-type targets — try another plan or relax filters." });
    if (b.totalLoad > 40) notes.push({ type: "risk", msg: "Heavy workload in this bundle (mock workload field)." });
    if (b.overlapHours > 0) notes.push({ type: "info", msg: `${b.overlapHours}h of overlapping sessions (pairwise sum) within your tolerance.` });
    else notes.push({ type: "info", msg: "No overlapping sessions detected in this bundle (mock)." });
    notes.push({ type: "info", msg: "Data is static fake catalog; plug in your source when ready." });

    document.getElementById("detail-notes").innerHTML = notes.map((n) => `<div class="note-item ${n.type}">${escapeHtml(n.msg)}</div>`).join("");
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function getScoreColor(score) {
    if (score > 85) return "var(--success)";
    if (score > 60) return "var(--accent)";
    return "var(--error)";
}

function timeToFloat(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    return h + m / 60;
}

function formatTime(floatTime) {
    const hours = Math.floor(floatTime);
    const minutes = (floatTime - hours) * 60;
    return `${String(hours).padStart(2, "0")}:${String(Math.round(minutes)).padStart(2, "0")}`;
}

function getDayAbbr(dayIndex) {
    return ["Sun", "Mon", "Tue", "Wed", "Thu"][dayIndex];
}

document.querySelectorAll(".day-chip").forEach((c) => {
    c.addEventListener("click", () => {
        c.classList.toggle("active");
        generateSuggestions();
    });
});

["target-core", "target-elective", "target-general", "window-start", "window-end", "overlap-tolerance"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", () => {
        updateTargetsLive();
        if (id !== "overlap-tolerance" && !["window-start", "window-end"].includes(id)) return;
        generateSuggestions();
    });
    el.addEventListener("input", () => {
        updateTargetsLive();
    });
});

document.getElementById("btn-generate").addEventListener("click", generateSuggestions);

updateTargetsLive();
generateSuggestions();

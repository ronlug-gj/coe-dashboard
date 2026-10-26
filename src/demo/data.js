/* DUMMY data for demos: the dashboard as it would look in พ.ค. 2573 (FY 2573, month 7).
 * Not real evaluation results. Clinics 1–6 continue the real FY 2568–2569 clinics with an
 * invented future; clinics 7–15 are invented. Clinics 14–15 are enrolled but not yet assigned
 * a tier (their only record is an unassessed placeholder). Run with `pnpm dev:demo`.
 *
 * Each clinic lists its evaluations (oldest first). Criteria texts, the clinic's current
 * state, tier history and KPI history are all derived from those evaluations so every
 * view stays consistent.
 */
import { TIERS, ENROLLED, CRITERIA, STATUS, PENDING, TIER_REQ, TIER_MIN } from "../data.js";

// Fiscal-year month order (ต.ค. first); kept local so this module doesn't import lib.js.
const MONTHS = ["ต.ค.", "พ.ย.", "ธ.ค.", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย."];

const AS_OF = { fy: 2573, month: 7, label: "พ.ค. 2573" };
const FISCAL_YEARS = [2568, 2569, 2570, 2571, 2572, 2573];
const COE_TARGET = { 2568: 2, 2569: 1, 2570: 1, 2571: 1, 2572: 1, 2573: 1 };

// ---------- Evaluation builder ----------
// Binary criteria in the order of the `bin` status string, e.g. "PPPPPWPFF".
const BIN = ["mdt", "swot", "profile", "tracer", "diagram", "present", "bench", "accredit", "training"];
const ROMAN = ["", "I", "II", "III", "IV"];

// "18 ก.ย. 2569" → fiscal year (ต.ค.–ธ.ค. belong to the next FY)
const fyOf = (date) => {
  if (!date) return null;
  const [, month, year] = date.split(" ");
  return MONTHS.indexOf(month) < 3 ? +year + 1 : +year;
};

function binaryCell(key, st) {
  const yes = key === "training" ? "ใช่" : "มี";
  // W in a `bin` string means "no data yet"; it is reported as ผ่านบางส่วน with the PENDING note.
  return st === "W" ? ["H", PENDING] : [st, { P: yes, F: `ไม่${yes}`, H: "อยู่ระหว่างจัดทำ" }[st]];
}

function r2rCell(r) {
  if (r === null) return ["H", "อยู่ระหว่างดำเนินการ"];
  const [any, tci, q] = r;
  const pub = [q && `Q1–Q4=${q}`, tci - q && `TCI 1=${tci - q}`].filter(Boolean).join(", ");
  return [tci >= 1 ? "P" : any >= 1 ? "H" : "F", `${any} เรื่อง${pub ? ` (${pub})` : ""}`];
}

const countCell = (n, pass, unit = "") =>
  n === null ? ["H", "อยู่ระหว่างเก็บข้อมูล"] : [n >= pass ? "P" : n > 0 ? "H" : "F", `${n}${unit}`];

/* E(date, tier, bin, facts, metrics, overrides)
 *   facts:   [sar, kpiyears, cqi, r2r [any, tci, q] | null, innov]   (null = รอข้อมูล)
 *   metrics: [growth %, outcomeMet, satisfaction %, research]
 */
function E(date, tier, bin, [sar, kpiyears, cqi, r2r, innov], [growth, outcomeMet, satisfaction, research], overrides = {}) {
  const criteria = Object.fromEntries(BIN.map((key, i) => [key, binaryCell(key, bin[i])]));
  criteria.sar = sar === null ? ["H", "กำลังดำเนินการ"] : sar === 4 ? ["P", "Part I-IV"] : sar > 0 ? ["H", `Part I-${ROMAN[sar]}`] : ["F", "ไม่มี"];
  criteria.outcome = outcomeMet === null ? ["H", "อยู่ระหว่างเก็บข้อมูล"] : outcomeMet ? ["P", "ผ่าน"] : ["F", "ไม่ผ่าน"];
  criteria.kpiyears = countCell(kpiyears, 3, " ปี");
  criteria.cqi = countCell(cqi, 3);
  criteria.r2r = r2rCell(r2r);
  criteria.innov = innov === 0.5 ? ["H", "1 (เรื่องเดียวกับ R2R)"] : countCell(innov, 1);
  Object.assign(criteria, overrides);
  return {
    date, tier, criteria,
    facts: { sar, kpiyears, cqi, r2r: r2r && { any: r2r[0], tci: r2r[1], q: r2r[2] }, innov },
    metrics: { growth, outcomeMet, satisfaction, research },
  };
}

const NA = [null, null, null, 0];

// Placeholder for a clinic enrolled but not yet assessed: no date, no tier, every criterion รอข้อมูล (W).
const UNASSESSED = {
  ...E(null, null, "WWWWWWWWW", [null, null, null, null, null], [null, null, null, null]),
  criteria: Object.fromEntries(CRITERIA.map((k) => [k.key, ["W", "รอการประเมินเพื่อจัดระดับ"]])),
};

// ---------- Clinics ----------
const RAW = [
  { id: 1, name: "Joint", dept: "ออร์โธปิดิกส์", joinFy: 2568, joinMonth: 0, evaluations: [
    E("20 ส.ค. 2568", 3, "PPPPPWPPP", [4, 5, 2, null, 0], [null, true, null, 7]),
    E("14 ส.ค. 2569", 3, "PPPPPPPPP", [4, 6, 3, [7, 4, 3], 0], [9, true, 82, 7]),
    E("19 ส.ค. 2570", 3, "PPPPPPPPP", [4, 7, 4, [7, 4, 3], 1], [12, true, 85, 5]),
    E("22 ส.ค. 2571", 3, "PPPPPPPPP", [4, 8, 5, [8, 5, 4], 1], [13, true, 87, 6]),
    E("20 ส.ค. 2572", 3, "PPPPPPPPP", [4, 9, 5, [8, 5, 4], 2], [14, true, 88, 6]),
  ] },
  { id: 2, name: "IR", dept: "รังสีร่วมรักษา", joinFy: 2568, joinMonth: 0, evaluations: [
    E("27 ส.ค. 2568", 2, "PPPPPWPFP", [null, 2, 0, null, null], [null, true, null, 2]),
    E("21 ส.ค. 2569", 2, "PPPPPPPFP", [4, 3, 1, [3, 1, 0], 0], [7, true, 78, 3]),
    E("25 ส.ค. 2570", 2, "PPPPPPPHP", [4, 4, 3, [4, 2, 1], 1], [10, true, 83, 2]),
    E("23 ส.ค. 2571", 2, "PPPPPPPHP", [4, 5, 4, [5, 3, 1], 1], [11, true, 85, 3]),
    E("27 ส.ค. 2572", 3, "PPPPPPPPP", [4, 6, 4, [5, 3, 2], 1], [12, true, 91, 3]),
  ] },
  { id: 3, name: "CKD", dept: "อายุรกรรม", joinFy: 2569, joinMonth: 0, evaluations: [
    E("16 ม.ค. 2569", 0, "PPPPPWPPP", [4, 4, 1, [3, 2, 2], 0.5], [null, true, null, 3]),
    E("18 ก.ย. 2569", 1, "PPPPPPPPP", [4, 4, 2, [4, 2, 2], 0.5], [6, true, 80, 3]),
    E("24 ส.ค. 2570", 2, "PPPPPPPPP", [4, 5, 3, [5, 3, 2], 1], [9, true, 82, 4]),
    E("21 ส.ค. 2571", 2, "PPPPPPPHP", [4, 6, 4, [6, 3, 3], 1], [10, true, 83, 4], { accredit: ["H", "อยู่ระหว่างขอรับรองซ้ำ"] }),
    E("26 ส.ค. 2572", 2, "PPPPPPPHP", [4, 7, 4, [6, 3, 3], 1], [8, true, 84, 4], { accredit: ["H", "อยู่ระหว่างขอรับรองซ้ำ"] }),
  ] },
  { id: 4, name: "Stroke", dept: "อายุรกรรม", joinFy: 2569, joinMonth: 0, evaluations: [
    E("23 ม.ค. 2569", 0, "FPFPFWPFF", [0, 2, 0, [0, 0, 0], 0], NA),
    E("17 ก.ย. 2569", 0, "PPFPPFPFF", [0, 2, 1, [0, 0, 0], 0], NA),
    E("28 ส.ค. 2570", 0, "PPPPPFPFF", [0, 3, 1, [0, 0, 0], 0], [4, null, 72, 0]),
    E("20 ส.ค. 2571", 1, "PPPPPPPFF", [1, 4, 2, [1, 0, 0], 0], [5, false, 74, 1]),
    E("25 ส.ค. 2572", 1, "PPPPPWPFF", [2, 5, 2, [2, 0, 0], 0], [6, false, 76, 2]),
  ] },
  { id: 5, name: "Obesity", dept: "อายุรกรรม", joinFy: 2569, joinMonth: 0, evaluations: [
    E("30 ม.ค. 2569", 0, "PPFPPWPFP", [0, 1.5, 0, null, 0], NA),
    E("24 ก.ย. 2569", 0, "PPPPPWPFP", [0, 2, 1, [1, 0, 0], 0], [null, null, null, 1]),
    E("27 ส.ค. 2570", 0, "PPPPPPPFP", [0, 3, 1, [1, 0, 0], 0], [null, true, null, 1]),
    E("26 ส.ค. 2571", 1, "PPPPPPPFP", [2, 4, 2, [2, 1, 0], 0], [null, true, null, 1]),
    E("29 ส.ค. 2572", 1, "PPPPPPPFP", [3, 5, 3, [2, 1, 0], 0], [null, true, null, 1]),
    E("12 มี.ค. 2573", 2, "PPPPPPPFP", [4, 5, 3, [3, 1, 0], 0], [null, true, null, 1]),
  ] },
  { id: 6, name: "MIS Spine", dept: "ออร์โธปิดิกส์", joinFy: 2569, joinMonth: 0, evaluations: [
    E("13 ก.พ. 2569", 0, "PPPPPWPFF", [3, 4, 4, [5, 4, 4], 0], [null, true, null, 5]),
    E("21 ส.ค. 2570", 1, "PPPPPPPFF", [3, 5, 5, [6, 4, 4], 0], [15, true, 76, 5]),
    E("18 ส.ค. 2571", 2, "PPPPPPPFF", [4, 6, 5, [7, 5, 4], 0], [16, true, 78, 6]),
    E("24 ส.ค. 2572", 2, "PPPPPPPFH", [4, 7, 5, [7, 5, 4], 0], [17, true, 79, 5], { training: ["H", "อยู่ระหว่างจัดทำหลักสูตร"] }),
  ] },
  { id: 7, name: "Cardiac", dept: "อายุรกรรมหัวใจ", joinFy: 2570, joinMonth: 2, evaluations: [
    E("19 ม.ค. 2570", 1, "PPPPPWPFF", [2, 4, 2, [3, 1, 0], 0], [null, true, null, 3]),
    E("28 ส.ค. 2570", 1, "PPPPPPPFF", [3, 4, 3, [3, 1, 1], 0], [18, true, 81, 3]),
    E("27 ส.ค. 2571", 2, "PPPPPPPFP", [4, 5, 4, [4, 2, 1], 0], [19, true, 84, 2]),
    E("21 ส.ค. 2572", 2, "PPPPPPPHP", [4, 6, 4, [5, 2, 2], 1], [21, true, 86, 2], { accredit: ["H", "อยู่ระหว่างขอรับรอง"] }),
  ] },
  { id: 8, name: "Breast", dept: "ศัลยกรรม", joinFy: 2570, joinMonth: 5, evaluations: [
    E("22 พ.ค. 2570", 0, "PPFPFWPFF", [0, 2, 0, null, 0], NA),
    E("19 ก.พ. 2571", 1, "PPPPPPPFF", [1, 3, 1, [1, 0, 0], 0], [8, true, 75, 1]),
    E("30 ส.ค. 2571", 1, "PPPPPPPFF", [2, 3, 2, [1, 1, 0], 0], [9, true, 76, 1]),
    E("28 ส.ค. 2572", 2, "PPPPPPPFF", [4, 4, 3, [2, 1, 0], 0], [11, false, 77, 1]),
  ] },
  { id: 9, name: "Sleep", dept: "โสต ศอ นาสิก", joinFy: 2571, joinMonth: 3, evaluations: [
    E("26 มี.ค. 2571", 0, "PFFPFWPFF", [0, 1, 0, null, 0], NA),
    E("31 ส.ค. 2571", 0, "PPPPFFPFF", [0, 2, 1, [0, 0, 0], 0], NA),
    E("30 ส.ค. 2572", 1, "PPPPPPPFF", [1, 3, 2, [1, 0, 0], 0], [7, null, 79, 1]),
  ] },
  { id: 10, name: "Diabetes", dept: "อายุรกรรม", joinFy: 2572, joinMonth: 1, evaluations: [
    E("14 ม.ค. 2572", 0, "PPFPFWPFF", [0, 2, 0, null, 0], NA),
    E("26 ส.ค. 2572", 0, "PPPPPWPFF", [0, 3, 1, [1, 0, 0], 0], [null, null, null, 1]),
    E("20 ก.พ. 2573", 1, "PPPPPPPFF", [1, 3, 1, [1, 0, 0], 0], [null, null, null, 1]),
  ] },
  { id: 11, name: "Hand", dept: "ออร์โธปิดิกส์", joinFy: 2572, joinMonth: 6, evaluations: [
    E("18 มิ.ย. 2572", 0, "PFFFFWFFF", [0, 1, 0, null, 0], NA),
    E("31 ส.ค. 2572", 0, "PPFPFWPFF", [0, 1, 1, null, 0], NA),
  ] },
  { id: 12, name: "Pain", dept: "วิสัญญีวิทยา", joinFy: 2572, joinMonth: 10, evaluations: [
    E("23 เม.ย. 2573", 0, "PPWWFWPFF", [0, null, 0, null, 0], NA),
  ] },
  { id: 13, name: "Retina", dept: "จักษุวิทยา", joinFy: 2573, joinMonth: 6, evaluations: [
    E("8 พ.ค. 2573", 0, "PWWWWWWFF", [null, 1, null, null, null], NA),
  ] },
  { id: 14, name: "Dermatology", dept: "ผิวหนัง", joinFy: 2572, joinMonth: 9, evaluations: [UNASSESSED] },
  { id: 15, name: "Psychiatry", dept: "จิตเวช", joinFy: 2573, joinMonth: 5, evaluations: [UNASSESSED] },
];

// Current state = latest evaluation; tier history = every tier change, by fiscal year.
const CLINICS = RAW.map((c) => {
  const evaluations = c.evaluations.map((e, i) => ({ id: String(i + 1), label: `ครั้งที่ ${i + 1}`, ...e }));
  const latest = evaluations[evaluations.length - 1];
  // History starts at the first assessment that gave a tier; enrolled clinics before that have none.
  const assessed = evaluations.filter((e) => e.tier !== null);
  const history = assessed.length ? [{ fy: fyOf(assessed[0].date), tier: assessed[0].tier }] : [];
  assessed.forEach((e) => {
    if (e.tier !== history[history.length - 1].tier) history.push({ fy: fyOf(e.date), tier: e.tier });
  });
  return { ...c, tier: latest.tier, criteria: latest.criteria, metrics: latest.metrics, facts: latest.facts, history, evaluations };
});

const FACTS = Object.fromEntries(CLINICS.map((c) => [c.name, c.facts]));

// KPI history for completed fiscal years: each clinic's last evaluation in that year,
// counting only clinics at GJCOE or above in that evaluation (same tests as the KPI cards).
const KPI_TESTS = {
  growth: (m) => (m.growth == null ? null : m.growth >= 10),
  outcome: (m) => m.outcomeMet ?? null,
  satisfaction: (m) => (m.satisfaction == null ? null : m.satisfaction >= 80),
  research: (m) => (m.research == null ? null : m.research >= 1),
};
const KPI_HISTORY = Object.fromEntries(FISCAL_YEARS.filter((fy) => fy < AS_OF.fy).map((fy) => {
  const snapshots = CLINICS.map((c) => c.evaluations.filter((e) => fyOf(e.date) === fy).pop()).filter((e) => e && e.tier >= 2);
  return [fy, Object.fromEntries(Object.entries(KPI_TESTS).map(([key, test]) => {
    const results = snapshots.map((e) => test(e.metrics)).filter((r) => r !== null);
    return [key, results.length ? Math.round((results.filter(Boolean).length / results.length) * 100) : null];
  }))];
}));

export { AS_OF, TIERS, ENROLLED, FISCAL_YEARS, COE_TARGET, KPI_HISTORY, CRITERIA, STATUS, PENDING, CLINICS, TIER_REQ, TIER_MIN, FACTS };

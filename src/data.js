/* Data for the COE dashboard (real evaluation data, ปีงบ 2568–2569).
 * Thai fiscal year: FY N runs ต.ค. (N-1) → ก.ย. N
 */

// Tier order: 0 = AOI → 1 = dGJCOE → 2 = GJCOE → 3 = iGJCOE
const TIERS = [
  { id: 0, code: "AOI", name: "Area of Interest", color: "#9AA3AF" },
  { id: 1, code: "dGJCOE", name: "Developing GJCOE", color: "#7FB5F0" },
  { id: 2, code: "GJCOE", name: "GJCOE", color: "#2B74D1" },
  { id: 3, code: "iGJCOE", name: "International GJCOE", color: "#0B3A82" },
];

const FISCAL_YEARS = [2568, 2569];

// Target number of newly established COE (GJCOE ขึ้นไป) per fiscal year: 2 ในปีแรก จากนั้นปีละ 1
const COE_TARGET = { 2568: 2, 2569: 1, 2570: 1, 2571: 1, 2572: 1 };

// Historical project outcome rates (%). Null means no year-specific result recorded.
// Do not reuse the current clinic metrics as historical results.
const KPI_HISTORY = {
  2568: { growth: null, outcome: null, satisfaction: null, research: null },
};

// Audit criteria (rows of the heatmap)
const CRITERIA = [
  { key: "mdt", label: "ทีมสหสาขาวิชาชีพ (แต่งตั้งคกก./คณะทำงาน)", short: "MDT", method: "มี/ไม่มี" },
  { key: "swot", label: "พันธกิจ วิสัยทัศน์ และ SWOT", short: "SWOT", method: "มี/ไม่มี" },
  { key: "profile", label: "Service Profile", short: "Profile", method: "มี/ไม่มี" },
  { key: "tracer", label: "Clinical Tracer/Flow การดูแล", short: "Tracer", method: "มี/ไม่มี" },
  { key: "diagram", label: "Driver Diagram", short: "Driver", method: "มี/ไม่มี" },
  { key: "present", label: "การส่งเข้าร่วมนำเสนอผลงาน", short: "นำเสนอ", method: "มี/ไม่มี" },
  { key: "bench", label: "คู่เทียบระดับประเทศ", short: "Benchmark", method: "มี/ไม่มี" },
  { key: "accredit", label: "การรับรองจากองค์กรภายนอก", short: "รับรอง", method: "มี/ไม่มี" },
  { key: "training", label: "ศูนย์อบรม/แหล่งศึกษาดูงาน", short: "ศูนย์อบรม", method: "ใช่/ไม่ใช่" },
  { key: "sar", label: "SAR", short: "SAR", method: "Part I–IV" },
  { key: "outcome", label: "ผลลัพธ์ตัวชี้วัดหลัก (Outcome KPI) ผ่านเกณฑ์", short: "Outcome", method: "ร้อยละผ่านเกณฑ์" },
  { key: "kpiyears", label: "ผลลัพธ์ KPI", short: "ปี KPI", method: "จำนวนปีที่แสดงผล" },
  { key: "cqi", label: "CQI", short: "CQI", method: "จำนวนเรื่อง" },
  { key: "r2r", label: "วิจัย/R2R", short: "R2R", method: "จำนวนเรื่อง" },
  { key: "innov", label: "นวัตกรรม", short: "นวัตกรรม", method: "จำนวนเรื่อง" },
];

// Cell status: P = ผ่าน, H = ผ่านบางส่วน, W = รอข้อมูล/อยู่ระหว่างดำเนินการ, F = ไม่ผ่าน
const STATUS = {
  P: { label: "ผ่าน", tone: "success" },
  H: { label: "ผ่านบางส่วน", tone: "warning" },
  W: { label: "รอข้อมูล", tone: "info" },
  F: { label: "ไม่ผ่าน", tone: "danger" },
};

const PENDING = "อยู่ระหว่างติดตามข้อมูล";

/* metrics (project Outcome KPIs, used for GJCOE / iGJCOE only):
 *   growth       – % ผู้รับบริการเพิ่มขึ้น (null = ยังไม่มีข้อมูล)
 *   outcomeMet   – ผลลัพธ์การรักษาเป็นไปตามเป้าหมาย (true/false/null)
 *   satisfaction – % ผู้รับบริการพึงพอใจระดับดีมาก (4) (null = ยังไม่มีข้อมูล)
 *   research     – จำนวนงานวิจัย/R2R ในปี
 * joinMonth: 0 = ต.ค. (เดือนแรกของปีงบ) … 11 = ก.ย.
 */
const CLINICS = [
  {
    id: 1, name: "Joint", dept: "ออร์โธปิดิกส์", tier: 3, joinFy: 2568, joinMonth: 0,
    criteria: {
      mdt: ["P", "มี"], swot: ["P", "มี"], profile: ["P", "มี"], tracer: ["P", "มี"], diagram: ["P", "มี"],
      present: ["W", PENDING], bench: ["P", "มี"], accredit: ["P", "มี"], training: ["P", "ใช่"],
      sar: ["P", "Part I-IV"], outcome: ["P", "ผ่าน"], kpiyears: ["P", "≥5 ปี"],
      cqi: ["H", "2"], r2r: ["W", "7 (รอคอนเฟิร์มข้อมูล)"], innov: ["F", "0"],
    },
    metrics: { growth: null, outcomeMet: true, satisfaction: null, research: 7 },
  },
  {
    id: 2, name: "IR", dept: "รังสีร่วมรักษา", tier: 2, joinFy: 2568, joinMonth: 0,
    criteria: {
      mdt: ["P", "มี"], swot: ["P", "มี"], profile: ["P", "มี"], tracer: ["P", "มี"], diagram: ["P", "มี"],
      present: ["W", PENDING], bench: ["P", "มี"], accredit: ["F", "ไม่มี"], training: ["P", "ใช่"],
      sar: ["W", "กำลังดำเนินการ"], outcome: ["P", "ผ่าน (11 ใน 13)"], kpiyears: ["P", "2 ปี (เริ่ม 2567)"],
      cqi: ["F", "0"], r2r: ["W", "2 (กำลังส่งตีพิมพ์)"], innov: ["W", "1 (กำลังดำเนินการ)"],
    },
    metrics: { growth: null, outcomeMet: true, satisfaction: null, research: 2 },
  },
  {
    id: 3, name: "CKD", dept: "อายุรกรรม", tier: 0, joinFy: 2569, joinMonth: 0,
    criteria: {
      mdt: ["P", "มี"], swot: ["P", "มี"], profile: ["P", "มี"], tracer: ["P", "มี"], diagram: ["P", "มี"],
      present: ["W", PENDING], bench: ["P", "มี"], accredit: ["P", "มี"], training: ["P", "ใช่"],
      sar: ["P", "Part I-IV"], outcome: ["P", "ผ่านปี 68 (77.78%)"], kpiyears: ["P", "4 ปี (เริ่ม 2566)"],
      cqi: ["H", "1 เรื่องตามกลุ่มเป้าหมาย · 2 เรื่องไม่ตรงกลุ่มเป้าหมาย"], r2r: ["P", "วิจัย 2 (Q1=2) · R2R 1 (ได้รางวัล)"],
      innov: ["H", "1 (เรื่องเดียวกับ R2R)"],
    },
    metrics: { growth: null, outcomeMet: true, satisfaction: null, research: 3 },
  },
  {
    id: 4, name: "Stroke", dept: "อายุรกรรม", tier: 0, joinFy: 2569, joinMonth: 0,
    criteria: {
      mdt: ["F", "ไม่มี"], swot: ["P", "มี"], profile: ["F", "ไม่มี"], tracer: ["P", "มี"], diagram: ["F", "ไม่มี"],
      present: ["W", PENDING], bench: ["P", "มี"], accredit: ["F", "ไม่มี"], training: ["F", "ไม่ใช่"],
      sar: ["F", "ไม่มี"], outcome: ["W", "อยู่ระหว่างเก็บข้อมูล"], kpiyears: ["P", "2 ปี (เริ่ม 2567)"],
      cqi: ["F", "0"], r2r: ["F", "0"], innov: ["F", "0"],
    },
    metrics: { growth: null, outcomeMet: null, satisfaction: null, research: 0 },
  },
  {
    id: 5, name: "Obesity", dept: "อายุรกรรม", tier: 0, joinFy: 2569, joinMonth: 0,
    criteria: {
      mdt: ["P", "มี"], swot: ["P", "มี"], profile: ["F", "ไม่มี"], tracer: ["P", "มี"], diagram: ["P", "มี"],
      present: ["W", PENDING], bench: ["P", "มี"], accredit: ["F", "ไม่มี"], training: ["P", "ใช่"],
      sar: ["F", "ไม่มี"], outcome: ["W", "อยู่ระหว่างเก็บข้อมูล"], kpiyears: ["P", "1 ปี 6 เดือน"],
      cqi: ["F", "0"], r2r: ["W", "อยู่ระหว่างดำเนินการ"], innov: ["F", "0"],
    },
    metrics: { growth: null, outcomeMet: null, satisfaction: null, research: 0 },
  },
  {
    id: 6, name: "MIS Spine", dept: "ออร์โธปิดิกส์", tier: 0, joinFy: 2569, joinMonth: 0,
    criteria: {
      mdt: ["P", "มี"], swot: ["P", "มี"], profile: ["P", "มี"], tracer: ["P", "มี"], diagram: ["P", "มี"],
      present: ["W", PENDING], bench: ["P", "มี"], accredit: ["F", "ไม่มี"], training: ["F", "ไม่ใช่"],
      sar: ["H", "Part I-III"], outcome: ["P", "ผ่าน (85%)"], kpiyears: ["P", "4 ปี (เริ่ม 2565)"],
      cqi: ["P", "4"], r2r: ["P", "5 (Q1=1, Q2=3) เสร็จ 4 · ระหว่างดำเนินการ 1"], innov: ["F", "0"],
    },
    metrics: { growth: null, outcomeMet: true, satisfaction: null, research: 5 },
  },
];

// Tier history: no promotions yet → each clinic stays at its entry tier
CLINICS.forEach((c) => (c.history = [{ fy: c.joinFy, tier: c.tier }]));

/* Requirements per tier (1 = dGJCOE, 2 = GJCOE, 3 = iGJCOE). Missing key = not required at that tier.
 * Binary criteria (มี/ใช่/ผ่าน) reuse the clinic's audit status.
 * Quantitative criteria are tested against FACTS below.
 */
const TIER_REQ = {
  mdt: { 1: "มี", 2: "มี", 3: "มี" },
  swot: { 1: "มี", 2: "มี", 3: "มี" },
  profile: { 1: "มี", 2: "มี", 3: "มี" },
  tracer: { 1: "มี", 2: "มี", 3: "มี" },
  diagram: { 1: "มี", 2: "มี", 3: "มี" },
  present: { 2: "มี", 3: "มี" },
  bench: { 2: "มี", 3: "มี" },
  accredit: { 3: "มี" },
  training: { 3: "ใช่" },
  sar: { 1: "Part I", 2: "Part I-IV", 3: "Part I-IV" },
  outcome: { 2: "ผ่าน", 3: "ผ่าน" },
  kpiyears: { 1: "≥1 ปี", 2: "≥3 ปี", 3: "≥3 ปี" },
  cqi: { 1: "≥1 เรื่อง", 2: "≥3 เรื่อง", 3: "≥3 เรื่อง" },
  r2r: { 1: "≥1 เรื่อง", 2: "ตีพิมพ์ TCI 1 ≥1 เรื่อง", 3: "ตีพิมพ์ Q1–Q4 ≥1 เรื่อง" },
  innov: { 3: "≥1 เรื่อง" },
};

// Numeric thresholds for quantitative criteria
const TIER_MIN = {
  sar: { 1: 1, 2: 4, 3: 4 },       // Part I-x
  kpiyears: { 1: 1, 2: 3, 3: 3 },  // years
  cqi: { 1: 1, 2: 3, 3: 3 },       // projects (on target)
  innov: { 3: 1 },
};

/* Facts per clinic (null = รอข้อมูล / อยู่ระหว่างดำเนินการ)
 *   sar: highest SAR part completed (0 = ไม่มี)
 *   kpiyears: years of KPI results
 *   cqi: CQI projects meeting target group
 *   r2r: { any: total research/R2R, tci: published TCI 1+, q: published Q1–Q4 }
 *   innov: innovations (0.5 = นับซ้ำกับ R2R → ผ่านบางส่วน)
 */
const FACTS = {
  "Joint":     { sar: 4, kpiyears: 5, cqi: 2, r2r: null, innov: 0 },
  "IR":        { sar: null, kpiyears: 2, cqi: 0, r2r: null, innov: null },
  "CKD":       { sar: 4, kpiyears: 4, cqi: 1, r2r: { any: 3, tci: 2, q: 2 }, innov: 0.5 },
  "Stroke":    { sar: 0, kpiyears: 2, cqi: 0, r2r: { any: 0, tci: 0, q: 0 }, innov: 0 },
  "Obesity":   { sar: 0, kpiyears: 1.5, cqi: 0, r2r: null, innov: 0 },
  "MIS Spine": { sar: 3, kpiyears: 4, cqi: 4, r2r: { any: 5, tci: 4, q: 4 }, innov: 0 },
};
CLINICS.forEach((c) => (c.facts = FACTS[c.name]));

// Ordered oldest to newest. Each evaluation is a complete, independent snapshot
// of all criteria, metrics and facts; do not infer an assessment date from entry FY.
CLINICS.forEach((c) => {
  c.evaluations = [{
    id: "1", label: "ครั้งที่ 1", date: null, tier: c.tier,
    criteria: JSON.parse(JSON.stringify(c.criteria)),
    metrics: { ...c.metrics }, facts: JSON.parse(JSON.stringify(c.facts)),
  }];
});

export { TIERS, FISCAL_YEARS, COE_TARGET, KPI_HISTORY, CRITERIA, STATUS, PENDING, CLINICS, TIER_REQ, TIER_MIN, FACTS };

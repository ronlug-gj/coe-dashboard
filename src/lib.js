/* Shared, framework-free helpers for the COE Monitor views. */
import { CRITERIA, CLINICS, TIERS, ENROLLED, TIER_REQ, TIER_MIN } from "./dataset.js";

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
// Tier id → display info; null (enrolled, not yet assigned) → ENROLLED.
export const tierInfo = (id) => (id === null ? ENROLLED : TIERS[id]);
export const tierClass = (id) => (id === null ? "tn" : `t${id}`);
export const MONTHS = ["ต.ค.", "พ.ย.", "ธ.ค.", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย."];
export const inScope = (fy) => CLINICS.filter((c) => c.joinFy <= fy);

// "18 ก.ย. 2569" → fiscal month number (fy * 12 + month index); null when undated.
const fiscalMonth = (date) => {
  if (!date) return null;
  const [, m, y] = date.split(" ");
  const mi = MONTHS.indexOf(m);
  return (mi < 3 ? +y + 1 : +y) * 12 + mi;
};
// Tier of clinic c in fiscal month mi of fy: undefined before it joined, null while it is
// still waiting for its first tier. Undated assessments count from the join month.
export function tierAt(c, fy, mi) {
  const at = fy * 12 + mi;
  if (c.joinFy * 12 + c.joinMonth > at) return undefined;
  let tier = null;
  c.evaluations.forEach((e) => {
    const from = fiscalMonth(e.date);
    if (e.tier !== null && (from === null || from <= at)) tier = e.tier;
  });
  return tier;
}

// Fiscal year a clinic first reached GJCOE or above (null if it hasn't).
export const coeSinceFy = (c) => c.history.find((h) => h.tier >= 2)?.fy ?? null;
// Clinics that were COE (GJCOE ขึ้นไป) by the end of fiscal year fy.
export const coeBy = (fy) => CLINICS.filter((c) => coeSinceFy(c) !== null && coeSinceFy(c) <= fy);
// Clinics promoted to a higher tier than their entry tier by fiscal year fy.
export const promotedBy = (fy) => CLINICS.filter((c) => c.history.some((h) => h.fy <= fy && h.tier > c.history[0].tier));

// Per-clinic criteria summary
export function critSummary(c) {
  const out = { P: 0, H: 0, F: 0, W: 0 };
  CRITERIA.forEach((k) => out[c.criteria[k.key][0]]++);
  return { ...out, total: CRITERIA.length };
}

// Status of clinic c against tier t's requirement for criterion key → "P" | "H" | "F" | null (not required)
// Missing data counts as "H", matching the criteria statuses.
export function tierStatus(c, key, t) {
  if (!TIER_REQ[key][t]) return null;
  const f = c.facts || {};
  if (key === "r2r") {
    if (f.r2r === null || f.r2r === undefined) return "H";
    const n = t === 1 ? f.r2r.any : t === 2 ? f.r2r.tci : f.r2r.q;
    return n >= 1 ? "P" : f.r2r.any > 0 ? "H" : "F";
  }
  if (TIER_MIN[key]) {
    const v = f[key];
    if (v === null || v === undefined) return "H";
    const min = TIER_MIN[key][t];
    return v >= min ? "P" : v > 0 ? "H" : "F";
  }
  return c.criteria[key][0]; // binary criteria: same result at every tier
}

export function selectedEvaluation(c, evaluationId) {
  return c.evaluations.find((e) => e.id === String(evaluationId)) || c.evaluations[c.evaluations.length - 1];
}

export function clinicPageUrl(id, evaluationId) {
  return `#clinic/${id}${evaluationId ? `/${encodeURIComponent(evaluationId)}` : ""}`;
}

/* Shared, framework-free helpers for the COE Monitor views. */
import { CRITERIA, CLINICS, TIER_REQ, TIER_MIN } from "./dataset.js";

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const MONTHS = ["ต.ค.", "พ.ย.", "ธ.ค.", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย."];
export const inScope = (fy) => CLINICS.filter((c) => c.joinFy <= fy);

// Fiscal year a clinic first reached GJCOE or above (null if it hasn't).
export const coeSinceFy = (c) => c.history.find((h) => h.tier >= 2)?.fy ?? null;
// Clinics that were COE (GJCOE ขึ้นไป) by the end of fiscal year fy.
export const coeBy = (fy) => CLINICS.filter((c) => coeSinceFy(c) !== null && coeSinceFy(c) <= fy);
// Clinics promoted to a higher tier than their entry tier by fiscal year fy.
export const promotedBy = (fy) => CLINICS.filter((c) => c.history.some((h) => h.fy <= fy && h.tier > c.history[0].tier));

// Per-clinic criteria summary
export function critSummary(c) {
  const out = { P: 0, H: 0, W: 0, F: 0 };
  CRITERIA.forEach((k) => out[c.criteria[k.key][0]]++);
  return { ...out, total: CRITERIA.length };
}

// Status of clinic c against tier t's requirement for criterion key → "P" | "H" | "W" | "F" | null (not required)
export function tierStatus(c, key, t) {
  if (!TIER_REQ[key][t]) return null;
  const f = c.facts || {};
  if (key === "r2r") {
    if (f.r2r === null || f.r2r === undefined) return "W";
    const n = t === 1 ? f.r2r.any : t === 2 ? f.r2r.tci : f.r2r.q;
    return n >= 1 ? "P" : f.r2r.any > 0 ? "H" : "F";
  }
  if (TIER_MIN[key]) {
    const v = f[key];
    if (v === null || v === undefined) return "W";
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

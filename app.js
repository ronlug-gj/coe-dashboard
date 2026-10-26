/* COE Monitor – dashboard prototype. Plain JS, bundled with Vite. */
import "./styles.css";
import { TIERS, FISCAL_YEARS, COE_TARGET, KPI_HISTORY, CRITERIA, STATUS, PENDING, CLINICS, TIER_REQ, TIER_MIN, FACTS } from "./data.js";
import { CLINIC_WORKS } from "./works.js";

// ---------- Helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
const MONTHS = ["ต.ค.", "พ.ย.", "ธ.ค.", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย."];
const isCOE = (c) => c.tier >= 2; // GJCOE ขึ้นไป

let FY = FISCAL_YEARS[FISCAL_YEARS.length - 1];
const inScope = () => CLINICS.filter((c) => c.joinFy <= FY);

function tierBadge(t, size = "") {
  const T = TIERS[t];
  return `<span class="tier-badge t${t} ${size}" title="${T.name}">${T.code}</span>`;
}
function pill(label, tone) { return `<span class="pill ${tone}">${label}</span>`; }

const icon = {
  check: '<svg viewBox="0 0 16 16"><path d="M6.4 11.6L2.8 8l1.1-1.1 2.5 2.5 5.7-5.7 1.1 1.1z"/></svg>',
  x: '<svg viewBox="0 0 16 16"><path d="M4.2 3.1L8 6.9l3.8-3.8 1.1 1.1L9.1 8l3.8 3.8-1.1 1.1L8 9.1l-3.8 3.8-1.1-1.1L6.9 8 3.1 4.2z"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6.4 5L12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4L12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z"/></svg>',
  clock: '<svg viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 110 13 6.5 6.5 0 010-13zm0 1.3a5.2 5.2 0 100 10.4A5.2 5.2 0 008 2.8zM7.4 4.5h1.2v3.2l2.3 1.4-.6 1-2.9-1.7z"/></svg>',
};

// Per-clinic criteria summary
function critSummary(c) {
  const out = { P: 0, H: 0, W: 0, F: 0 };
  CRITERIA.forEach((k) => out[c.criteria[k.key][0]]++);
  return { ...out, total: CRITERIA.length };
}
function segBar(c) {
  return `<span class="segbar">${CRITERIA.map((k) => `<span class="s-${c.criteria[k.key][0]}" title="${esc(k.label)}: ${STATUS[c.criteria[k.key][0]].label}"></span>`).join("")}</span>`;
}

// ---------- KPI cards ----------
function kpiHistory(key, threshold, current) {
  const years = FISCAL_YEARS.filter((year) => year <= FY).sort((a, b) => a - b).slice(-5);
  const labels = { P: "บรรลุเป้าหมาย", H: "บรรลุบางส่วน", W: "รอข้อมูล", F: "ไม่บรรลุเป้าหมาย" };
  const cells = years.map((year) => {
    const value = year === FY ? current.value : key === "established"
      ? CLINICS.filter((c) => c.joinFy === year && c.history[0].tier >= 2).length
      : KPI_HISTORY[year]?.[key];
    const target = key === "established" ? COE_TARGET[year] : threshold;
    const status = year === FY ? current.status : value == null || target == null ? "W" : value >= target ? "P" : value > 0 ? "H" : "F";
    const detail = `ปีงบ ${year}: ${labels[status]}${value == null ? "" : key === "established" ? ` · ${value}/${target} ศูนย์` : ` · ${value}% (เป้า ≥${target}%)`}`;
    return `<span class="kpi-history-year"><span class="kpi-history-square s-${status}" tabindex="0" role="img" aria-label="${esc(detail)}" title="${esc(detail)}"></span><small>${String(year).slice(-2)}</small></span>`;
  }).join("");
  return `<div class="kpi-history"><small>ผลรายปีถึงปีงบ ${FY}</small><div class="kpi-history-years">${cells}</div></div>`;
}

function rateCard({ key, label, note, clinics, test, threshold }) {
  // test(c) → true / false / null (no data)
  const withData = clinics.filter((c) => test(c) !== null);
  const met = withData.filter((c) => test(c) === true).length;
  const pending = clinics.length - withData.length;
  const v = pct(met, withData.length);
  const has = withData.length > 0;
  const ok = has && v >= threshold;
  const status = !has ? "W" : ok ? "P" : met > 0 ? "H" : "F";
  return `
    <div class="stat kpi-status s-${status}">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${has ? `${v}%` : "–"}<small> ${met}/${withData.length} ศูนย์</small></div>
      ${kpiHistory(key, threshold, { value: has ? v : null, status })}
      <div class="stat-foot">
        ${!has ? `${icon.clock} รอข้อมูล` : ok ? `${icon.check} บรรลุเป้า ≥${threshold}%` : `ต่ำกว่าเป้า ${threshold}%`}
        ${pending && has ? ` · รอข้อมูล ${pending} ศูนย์` : ""}
      </div>
      <div class="stat-note">${note}</div>
    </div>`;
}

function renderStats() {
  const scope = inScope();
  const coe = scope.filter(isCOE);
  const newCoe = coe.filter((c) => c.joinFy === FY).length;
  const target = COE_TARGET[FY] || 0;
  const cumTarget = FISCAL_YEARS.filter((y) => y <= FY).reduce((s, y) => s + (COE_TARGET[y] || 0), 0);
  const ok = newCoe >= target;

  const coeCard = `
    <div class="stat kpi-status s-${ok ? "P" : newCoe > 0 ? "H" : "F"}">
      <div class="stat-label">จำนวนการจัดตั้ง COE ปีงบ ${FY}</div>
      <div class="stat-value">${newCoe}<small> / เป้า ${target} ศูนย์</small></div>
      ${kpiHistory("established", target, { value: newCoe, status: ok ? "P" : newCoe > 0 ? "H" : "F" })}
      <div class="stat-foot">${ok ? `${icon.check} บรรลุเป้าหมาย` : `ขาดอีก ${target - newCoe} ศูนย์`}</div>
      <div class="stat-note">สะสม ${coe.length}/${cumTarget} ศูนย์ · เป้า 2 ศูนย์ปีแรก จากนั้นปีละ 1</div>
    </div>`;

  const scopeNote = `เฉพาะ GJCOE และ iGJCOE (${coe.length} ศูนย์)`;
  const m = (k) => (c) => (c.metrics[k] === null || c.metrics[k] === undefined ? null : c.metrics[k]);
  return `<div class="stats five">
    ${coeCard}
    ${rateCard({ key: "growth", label: "อัตราศูนย์ GJCOE ที่มีผู้รับบริการเพิ่มขึ้น ≥10%", note: `Outcome KPI · ${scopeNote}`, clinics: coe,
      test: (c) => (m("growth")(c) === null ? null : c.metrics.growth >= 10), threshold: 80 })}
    ${rateCard({ key: "outcome", label: "อัตราศูนย์ GJCOE ที่มีผลลัพธ์การรักษาเป็นไปตามเป้าหมาย", note: `Outcome KPI · ${scopeNote}`, clinics: coe,
      test: m("outcomeMet"), threshold: 80 })}
    ${rateCard({ key: "satisfaction", label: "อัตราศูนย์ GJCOE ที่มีความพึงพอใจระดับดีมาก (4) ≥80%", note: scopeNote, clinics: coe,
      test: (c) => (m("satisfaction")(c) === null ? null : c.metrics.satisfaction >= 80), threshold: 80 })}
    ${rateCard({ key: "research", label: "อัตราศูนย์ GJCOE ที่มีงานวิจัย/R2R ≥1 เรื่อง/ศูนย์/ปี", note: scopeNote, clinics: coe,
      test: (c) => (m("research")(c) === null ? null : c.metrics.research >= 1), threshold: 80 })}
  </div>`;
}

// ---------- Area chart: clinics in program by month, by tier ----------
function areaChart() {
  const months = [];
  FISCAL_YEARS.filter((y) => y <= FY).forEach((fy) => MONTHS.forEach((mName, mi) => {
    const yr = String((mi < 3 ? fy - 1 : fy) % 100).padStart(2, "0");
    months.push({ fy, mi, label: `${mName} ${yr}` });
  }));
  const counts = months.map((mo) => TIERS.map((t) => CLINICS.filter((c) =>
    c.tier === t.id && (c.joinFy < mo.fy || (c.joinFy === mo.fy && c.joinMonth <= mo.mi))).length));
  const totals = counts.map((r) => r.reduce((a, b) => a + b, 0));
  const max = Math.max(4, Math.ceil(Math.max(...totals) / 2) * 2);

  const w = 760, h = 240, pl = 30, pr = 12, pt = 16, pb = 34;
  const x = (i) => pl + (i * (w - pl - pr)) / (months.length - 1);
  const y = (v) => h - pb - (v / max) * (h - pt - pb);
  let s = "";
  for (let v = 0; v <= max; v += max / 4) s += `<line x1="${pl}" x2="${w - pr}" y1="${y(v)}" y2="${y(v)}" class="axis-grid"/><text x="${pl - 6}" y="${y(v) + 4}" class="axis-label" text-anchor="end">${v}</text>`;
  // stacked areas (bottom = AOI)
  const cum = months.map(() => 0);
  TIERS.forEach((t) => {
    const lower = cum.slice();
    counts.forEach((r, i) => (cum[i] += r[t.id]));
    if (!counts.some((r) => r[t.id])) return;
    const top = cum.map((v, i) => `${x(i)},${y(v)}`).join(" ");
    const bot = lower.map((v, i) => `${x(i)},${y(v)}`).reverse().join(" ");
    s += `<polygon points="${top} ${bot}" fill="${t.color}" fill-opacity="0.85"><title>${t.code}</title></polygon>`;
  });
  s += `<polyline points="${totals.map((v, i) => `${x(i)},${y(v)}`).join(" ")}" fill="none" stroke="#17212f" stroke-width="1.5"/>`;
  months.forEach((mo, i) => {
    if (mo.mi % 3 === 0) s += `<text x="${x(i)}" y="${h - pb + 16}" class="axis-label ${mo.mi === 0 ? "strong" : ""}" text-anchor="middle">${mo.label}</text>`;
    if (mo.mi === 0 && i) s += `<line x1="${x(i)}" x2="${x(i)}" y1="${pt}" y2="${h - pb}" class="fy-line"/>`;
    if (mo.mi === 0) s += `<text x="${x(i) + 4}" y="${pt + 8}" class="axis-label">ปีงบ ${mo.fy}</text>`;
  });
  const last = totals.length - 1;
  s += `<text x="${x(last) - 4}" y="${y(totals[last]) - 6}" class="bar-label strong" text-anchor="end">${totals[last]} ศูนย์</text>`;

  return `
    <section class="card span-7">
      <header class="card-head"><div>
        <h3>จำนวนศูนย์ในโครงการรายเดือน</h3>
        <p>จำแนกตามระดับปัจจุบัน · ต.ค. ${(FISCAL_YEARS[0] - 1) % 100} – ก.ย. ${FY % 100}</p>
      </div></header>
      <svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">${s}</svg>
      <div class="legend-row">${TIERS.map((t) => `<span><i class="sw t${t.id}"></i>${t.code}</span>`).join("")}</div>
    </section>`;
}

// ---------- Bar chart: new COE per fiscal year by tier ----------
function barChart() {
  const years = FISCAL_YEARS;
  const data = years.map((fy) => TIERS.map((t) => CLINICS.filter((c) => c.joinFy === fy && c.tier === t.id).length));
  const max = Math.max(4, ...data.map((r) => r.reduce((a, b) => a + b, 0)), ...years.map((y) => COE_TARGET[y] || 0));
  const w = 420, h = 240, pl = 30, pt = 20, pb = 34;
  const y = (v) => h - pb - (v / max) * (h - pt - pb);
  const bw = (w - pl) / years.length;
  let s = "";
  for (let v = 0; v <= max; v++) s += `<line x1="${pl}" x2="${w}" y1="${y(v)}" y2="${y(v)}" class="axis-grid"/><text x="${pl - 6}" y="${y(v) + 4}" class="axis-label" text-anchor="end">${v}</text>`;
  years.forEach((fy, i) => {
    const x0 = pl + i * bw + bw * 0.25, bwi = bw * 0.5;
    let acc = 0;
    TIERS.forEach((t) => {
      const n = data[i][t.id];
      if (!n) return;
      s += `<rect x="${x0}" y="${y(acc + n)}" width="${bwi}" height="${y(acc) - y(acc + n)}" fill="${t.color}"><title>${t.code}: ${n} ศูนย์</title></rect>`;
      const joined = CLINICS.filter((c) => c.joinFy === fy && c.tier === t.id);
      joined.forEach((c, j) => {
        s += `<text x="${x0 + bwi / 2}" y="${(y(acc + j) + y(acc + j + 1)) / 2 + 4}" class="seg-label" text-anchor="middle">${esc(c.name)}</text>`;
      });
      acc += n;
    });
    const tg = COE_TARGET[fy] || 0;
    s += `<line x1="${x0 - 8}" x2="${x0 + bwi + 8}" y1="${y(tg)}" y2="${y(tg)}" class="target-line"/>`;
    s += `<text x="${x0 + bwi + 10}" y="${y(tg) + 4}" class="axis-label">เป้า COE ${tg}</text>`;
    s += `<text x="${x0 + bwi / 2}" y="${y(acc) - 6}" class="bar-label strong" text-anchor="middle">${acc}</text>`;
    s += `<text x="${x0 + bwi / 2}" y="${h - 12}" class="axis-label ${fy === FY ? "strong" : ""}" text-anchor="middle">ปีงบ ${fy}</text>`;
  });
  return `
    <section class="card span-5">
      <header class="card-head"><div>
        <h3>จำนวน COE จัดตั้งใหม่รายปีงบประมาณ</h3>
        <p>จำแนกตามระดับ GJCOE · เส้นประ = เป้าหมาย COE (GJCOE ขึ้นไป)</p>
      </div></header>
      <svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">${s}</svg>
      <div class="legend-row">${TIERS.map((t) => `<span><i class="sw t${t.id}"></i>${t.code}</span>`).join("")}<span><i class="sw target"></i>เป้าหมาย</span></div>
    </section>`;
}

// ---------- Heatmap: audit criteria × clinic + pass rate by tier ----------
// Status of clinic c against tier t's requirement for criterion key → "P" | "H" | "W" | "F" | null (not required)
function tierStatus(c, key, t) {
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

let HM_CLINIC = "all";
function heatmap() {
  const all = inScope().slice().sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name));
  if (HM_CLINIC !== "all" && !all.some((c) => c.id === +HM_CLINIC)) HM_CLINIC = "all";
  const clinics = HM_CLINIC === "all" ? all : all.filter((c) => c.id === +HM_CLINIC);
  const slicer = `<label class="slicer">ศูนย์
    <select id="hm-clinic"><option value="all">ทุกศูนย์ (${all.length})</option>
    ${all.map((c) => `<option value="${c.id}" ${String(c.id) === String(HM_CLINIC) ? "selected" : ""}>${esc(c.name)} · ${TIERS[c.tier].code}</option>`).join("")}
    </select></label>`;
  const tiers = TIERS.slice().reverse();
  const reqTiers = TIERS.filter((t) => t.id > 0); // AOI has no requirements; order dGJCOE → GJCOE → iGJCOE
  const groups = tiers.map((t) => ({ t, list: clinics.filter((c) => c.tier === t.id) })).filter((g) => g.list.length);

  const rateCell = (n, d, req, extra = "") => {
    if (!d) return `<td class="hm-rate na">–</td>`;
    const v = pct(n, d);
    return `<td class="hm-rate" style="--a:${(0.08 + 0.72 * v / 100).toFixed(2)}" title="${n}/${d}${extra}">${v}%${req ? `<small>${esc(req)}</small>` : ""}</td>`;
  };

  const head1 = `<tr><th rowspan="2" class="hm-crit">เกณฑ์</th><th rowspan="2" class="hm-method">การประเมิน</th>
    ${groups.map((g) => `<th colspan="${g.list.length}" class="hm-group">${tierBadge(g.t.id, "sm")}</th>`).join("")}
    <th colspan="${reqTiers.length}" class="hm-group rate">อัตราผ่านเกณฑ์ตามระดับ <small>(${clinics.length} ศูนย์ที่เลือก)</small></th></tr>`;
  const head2 = `<tr>${groups.map((g) => g.list.map((c) => `<th class="hm-clinic"><button data-clinic="${c.id}">${esc(c.name)}</button></th>`).join("")).join("")}
    ${reqTiers.map((t) => `<th class="hm-clinic">${t.code}</th>`).join("")}</tr>`;

  const rows = CRITERIA.map((k) => {
    const cells = groups.map((g) => g.list.map((c) => {
      const [st, txt] = c.criteria[k.key];
      return `<td class="hm-cell s-${st}" title="${esc(c.name)} · ${STATUS[st].label}">${esc(txt)}</td>`;
    }).join("")).join("");
    const rates = reqTiers.map((t) => {
      const req = TIER_REQ[k.key][t.id];
      if (!req) return `<td class="hm-rate na" title="ไม่ใช่เกณฑ์ของระดับ ${t.code}">–</td>`;
      const res = clinics.map((c) => tierStatus(c, k.key, t.id));
      const w = res.filter((s) => s === "W").length;
      return rateCell(res.filter((s) => s === "P").length, clinics.length, req, w ? ` · รอข้อมูล ${w}` : "");
    }).join("");
    return `<tr><th class="hm-crit">${esc(k.label)}</th><td class="hm-method">${esc(k.method)}</td>${cells}${rates}</tr>`;
  }).join("");

  const foot = `<tr class="hm-foot"><th class="hm-crit">ผ่านเกณฑ์รวม</th><td class="hm-method">ร้อยละ</td>
    ${groups.map((g) => g.list.map((c) => { const s = critSummary(c); return `<td class="hm-sum"><b>${pct(s.P, s.total)}%</b><small>${s.P}/${s.total}</small></td>`; }).join("")).join("")}
    ${reqTiers.map((t) => {
      const keys = CRITERIA.filter((k) => TIER_REQ[k.key][t.id]);
      const met = clinics.reduce((a, c) => a + keys.filter((k) => tierStatus(c, k.key, t.id) === "P").length, 0);
      return rateCell(met, keys.length * clinics.length, `${keys.length} เกณฑ์`);
    }).join("")}</tr>`;

  return `
    <section class="card span-12">
      <header class="card-head"><div>
        <h3>ผลการตรวจประเมินตามเกณฑ์ COE</h3>
        <p>ผลการตรวจรายศูนย์ และอัตราการผ่านเกณฑ์แยกตามระดับ · คลิกชื่อศูนย์เพื่อดูรายละเอียด</p>
      </div>
      <div class="hm-tools">${slicer}
      <div class="legend-row tight">${Object.entries(STATUS).map(([k, v]) => `<span><i class="sw s-${k}"></i>${v.label}</span>`).join("")}</div></div>
      </header>
      <div class="table-wrap"><table class="heatmap"><thead>${head1}${head2}</thead><tbody>${rows}${foot}</tbody></table></div>
    </section>`;
}

function mountHeatmap() {
  const box = $("#hm-box");
  box.innerHTML = heatmap();
  box.querySelectorAll("[data-clinic]").forEach((b) => b.addEventListener("click", () => openDrawer(+b.dataset.clinic)));
  $("#hm-clinic").addEventListener("change", (e) => { HM_CLINIC = e.target.value; mountHeatmap(); });
}

// ---------- Overview ----------
function renderOverview() {
  const scope = inScope();
  $("#view").innerHTML = `
    <div class="page-head"><div>
      <h1>ภาพรวมโครงการ</h1>
      <p>ปีงบประมาณ ${FY} · ${scope.length} ศูนย์ในโครงการ · COE (GJCOE ขึ้นไป) ${scope.filter(isCOE).length} ศูนย์ · ยังไม่มีศูนย์ที่เลื่อนระดับ</p>
    </div></div>
    <h2 class="section-title">ตัวชี้วัดโครงการ</h2>
    ${renderStats()}
    <h2 class="section-title">การเติบโตของโครงการ</h2>
    <div class="grid">${areaChart()}${barChart()}</div>
    <h2 class="section-title">ผลการตรวจประเมินศูนย์</h2>
    <div class="grid" id="hm-box"></div>`;
  mountHeatmap();
}

// ---------- Clinic list ----------
let listState = { tier: "all", q: "", criteria: [], sort: "tier", direction: "desc" };
const CLINIC_COLUMNS = [
  { key: "name", label: "ศูนย์" },
  { key: "tier", label: "ระดับปัจจุบัน" },
  { key: "joinFy", label: "ปีที่เข้าร่วม" },
  { key: "passed", label: `ผลการตรวจ (${CRITERIA.length} เกณฑ์)`, hint: "จำนวนเกณฑ์ที่ผ่าน" },
  { key: "unmet", label: "ยังไม่ผ่าน", hint: "จำนวนเกณฑ์ที่ไม่ผ่านหรือผ่านบางส่วน" },
  { key: "waiting", label: "รอข้อมูล", hint: "จำนวนเกณฑ์ที่รอข้อมูล" },
];

function compareClinics(a, b) {
  const value = (c) => {
    const s = critSummary(c);
    return ({ name: c.name, tier: c.tier, joinFy: c.joinFy, passed: s.P, unmet: s.F + s.H, waiting: s.W })[listState.sort];
  };
  const av = value(a), bv = value(b);
  const result = typeof av === "string" ? av.localeCompare(bv, "th", { numeric: true, sensitivity: "base" }) : av - bv;
  return result * (listState.direction === "asc" ? 1 : -1) ||
    (listState.sort === "tier" ? critSummary(b).P - critSummary(a).P : 0) ||
    a.name.localeCompare(b.name, "th") || a.id - b.id;
}

function updateSortHeaders() {
  document.querySelectorAll("[data-sort]").forEach((button) => {
    const active = button.dataset.sort === listState.sort;
    const column = CLINIC_COLUMNS.find((c) => c.key === button.dataset.sort);
    button.closest("th").setAttribute("aria-sort", active ? (listState.direction === "asc" ? "ascending" : "descending") : "none");
    button.querySelector(".sort-icon").textContent = active ? (listState.direction === "asc" ? "↑" : "↓") : "↕";
    button.setAttribute("aria-label", `${column.label}: เรียง${active && listState.direction === "asc" ? "จากมากไปน้อย" : "จากน้อยไปมาก"}`);
  });
}

function renderClinics() {
  const scope = inScope();
  const tierCards = [
    `<button class="tier-card ${listState.tier === "all" ? "active" : ""}" data-tier="all">
       <span class="tc-label">ทั้งหมด</span><span class="tc-value">${scope.length}</span><span class="tc-foot muted">ศูนย์ในโครงการ</span></button>`,
    ...TIERS.map((t) => `<button class="tier-card t${t.id} ${String(listState.tier) === String(t.id) ? "active" : ""}" data-tier="${t.id}">
        <span class="tc-label">${tierBadge(t.id, "sm")} <small>${t.name}</small></span>
        <span class="tc-value">${scope.filter((c) => c.tier === t.id).length}</span>
        <span class="tc-foot muted">ศูนย์</span></button>`),
  ].join("");

  $("#view").innerHTML = `
    <div class="page-head"><div>
      <h1>ศูนย์ทั้งหมด</h1>
      <p>ผลการตรวจประเมินรายศูนย์ · คลิกแถวเพื่อดูรายละเอียด</p>
    </div></div>
    <div class="tier-cards">${tierCards}</div>
    <div class="card table-card">
      <div class="toolbar">
        <div class="search">
          <svg viewBox="0 0 24 24"><path d="M10 4a6 6 0 104.47 10l4.76 4.77 1.06-1.06-4.76-4.77A6 6 0 0010 4zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z"/></svg>
          <input id="q" type="search" placeholder="ค้นหาศูนย์หรือแผนก" value="${esc(listState.q)}" />
        </div>
        <div class="criteria-filter">
          <span id="criteria-filter-label">เกณฑ์ที่ยังไม่ผ่าน</span>
          <details class="criteria-picker" id="criteria-picker">
            <summary aria-describedby="criteria-filter-label criteria-filter-help"><span id="criteria-selection">${criteriaSelectionLabel()}</span></summary>
            <div class="criteria-options">
              <button type="button" id="clear-criteria">ล้างการเลือก</button>
              <div role="group" aria-labelledby="criteria-filter-label">
                ${CRITERIA.map((k) => `<label><input type="checkbox" value="${k.key}" ${listState.criteria.includes(k.key) ? "checked" : ""}>${esc(k.label)}</label>`).join("")}
              </div>
            </div>
          </details>
          <small id="criteria-filter-help">ตรงอย่างน้อย 1 เกณฑ์ที่เลือก · รวมไม่ผ่าน บางส่วน และรอข้อมูล</small>
        </div>
        <span class="result-count" id="result-count" aria-live="polite"></span>
      </div>
      <div class="table-wrap">
        <table class="clinic-table">
          <thead><tr>${CLINIC_COLUMNS.map((c) => `<th scope="col" ${c.key === "waiting" ? 'class="num"' : ""}><button class="column-sort" data-sort="${c.key}" title="เรียงตาม${c.hint || c.label}">${c.label} <span class="sort-icon" aria-hidden="true">↕</span></button></th>`).join("")}</tr></thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </div>`;

  $("#view").querySelectorAll(".tier-card").forEach((b) => b.addEventListener("click", () => { listState.tier = b.dataset.tier; renderClinics(); }));
  $("#q").addEventListener("input", (e) => { listState.q = e.target.value; renderRows(); });
  $("#criteria-picker").addEventListener("change", () => {
    listState.criteria = Array.from($("#criteria-picker").querySelectorAll("input:checked"), (input) => input.value);
    $("#criteria-selection").textContent = criteriaSelectionLabel();
    renderRows();
  });
  $("#clear-criteria").addEventListener("click", () => {
    listState.criteria = [];
    $("#criteria-picker").querySelectorAll("input").forEach((input) => { input.checked = false; });
    $("#criteria-selection").textContent = criteriaSelectionLabel();
    renderRows();
  });
  $("#criteria-picker").addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      $("#criteria-picker").open = false;
      $("#criteria-picker summary").focus();
    }
  });
  $("#view").querySelectorAll("[data-sort]").forEach((button) => button.addEventListener("click", () => {
    listState.direction = listState.sort === button.dataset.sort && listState.direction === "asc" ? "desc" : "asc";
    listState.sort = button.dataset.sort;
    updateSortHeaders();
    renderRows();
  }));
  updateSortHeaders();
  renderRows();
}

function criteriaSelectionLabel() {
  return listState.criteria.length ? `เลือก ${listState.criteria.length} เกณฑ์: ${CRITERIA.filter((k) => listState.criteria.includes(k.key)).map((k) => k.short).join(", ")}` : "ทุกเกณฑ์ (ไม่กรอง)";
}

function renderRows() {
  const q = listState.q.trim().toLowerCase();
  const rows = inScope().filter((c) =>
    (listState.tier === "all" || c.tier === +listState.tier) &&
    (!listState.criteria.length || listState.criteria.some((key) => c.criteria[key][0] !== "P")) &&
    (!q || c.name.toLowerCase().includes(q) || c.dept.toLowerCase().includes(q)))
    .sort(compareClinics);

  $("#result-count").textContent = `${rows.length} ศูนย์`;
  $("#rows").innerHTML = rows.map((c) => {
    const s = critSummary(c);
    const fails = CRITERIA.filter((k) => ["F", "H"].includes(c.criteria[k.key][0]));
    const chips = fails.slice(0, 4).map((k) => `<span class="chip ${c.criteria[k.key][0] === "F" ? "chip-kpi" : ""}">${k.short}</span>`).join("") +
      (fails.length > 4 ? `<span class="chip more">+${fails.length - 4}</span>` : "");
    return `
      <tr data-clinic="${c.id}" tabindex="0">
        <td><div class="cl-name">${esc(c.name)}</div><div class="cl-dept">${esc(c.dept)}</div></td>
        <td>${tierBadge(c.tier)}</td>
        <td>ปีงบ ${c.joinFy}</td>
        <td><div class="prog">${segBar(c)}<span class="prog-text"><b>${s.P}/${s.total}</b> ผ่าน</span></div></td>
        <td><div class="chips">${chips || '<span class="muted">—</span>'}</div></td>
        <td class="num">${s.W}</td>
      </tr>`;
  }).join("") || `<tr><td colspan="6" class="empty">ไม่พบศูนย์ตามเงื่อนไข</td></tr>`;

  $("#rows").querySelectorAll("tr[data-clinic]").forEach((tr) => {
    tr.addEventListener("click", () => openDrawer(+tr.dataset.clinic));
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter") openDrawer(+tr.dataset.clinic); });
  });
}

// ---------- Evaluation views ----------
function selectedEvaluation(c, evaluationId) {
  return c.evaluations.find((e) => e.id === String(evaluationId)) || c.evaluations[c.evaluations.length - 1];
}

function evaluationSelectors(c, evaluation, showClinic = true, showEvaluation = true) {
  return `<div class="evaluation-selectors">
    ${showClinic ? `<label>ศูนย์<select data-select-clinic>${CLINICS.map((x) => `<option value="${x.id}" ${x.id === c.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>` : ""}
    ${showEvaluation ? `<label>การประเมิน<select data-select-evaluation>${c.evaluations.map((e) => `<option value="${esc(e.id)}" ${e.id === evaluation.id ? "selected" : ""}>${esc(e.label)}${e.date ? ` · ${esc(e.date)}` : " · ไม่ระบุวันที่"}</option>`).join("")}</select></label>` : ""}
  </div>`;
}

function bindEvaluationSelectors(root, c, onSelect) {
  root.querySelector("[data-select-clinic]")?.addEventListener("change", (e) => onSelect(+e.target.value));
  root.querySelector("[data-select-evaluation]")?.addEventListener("change", (e) => onSelect(c.id, e.target.value));
}

function evaluationBody(clinic, evaluation) {
  const c = { ...clinic, ...evaluation };
  const s = critSummary(c);
  const ladder = TIERS.map((t) => `
    <div class="ladder-step ${t.id <= c.tier ? "done" : ""} ${t.id === c.tier ? "current" : ""} t${t.id}">
      <span class="ladder-dot"></span><span class="ladder-code">${t.code}</span><span class="ladder-name">${t.name}</span>
    </div>`).join("");
  const items = CRITERIA.map((k) => {
    const [st, txt] = c.criteria[k.key];
    return `<li class="crit-item"><span class="hm-dot s-${st}"></span><span class="ci-label">${esc(k.label)}<small>${esc(txt)}</small></span>${pill(STATUS[st].label, STATUS[st].tone)}</li>`;
  }).join("");
  const mv = (v, unit) => (v === null || v === undefined ? '<span class="muted">รอข้อมูล</span>' : `${v}${unit}`);

  return `
      <div class="ladder">${ladder}</div>
      <div class="mini-stats">
        <div><span>ผ่านเกณฑ์</span><b>${s.P}/${s.total}</b></div>
        <div><span>ผ่านบางส่วน</span><b>${s.H}</b></div>
        <div><span>รอข้อมูล</span><b>${s.W}</b></div>
        <div><span>ไม่ผ่าน</span><b>${s.F}</b></div>
      </div>
      <h4>ตัวชี้วัดผลลัพธ์</h4>
      <div class="mini-stats">
        <div><span>ผู้รับบริการเพิ่มขึ้น</span><b>${mv(c.metrics.growth, "%")}</b></div>
        <div><span>ผลลัพธ์การรักษา</span><b>${c.metrics.outcomeMet == null ? '<span class="muted">รอข้อมูล</span>' : c.metrics.outcomeMet ? "ตามเป้า" : "ไม่ตามเป้า"}</b></div>
        <div><span>พึงพอใจระดับ 4</span><b>${mv(c.metrics.satisfaction, "%")}</b></div>
        <div><span>วิจัย/R2R</span><b>${mv(c.metrics.research, " เรื่อง")}</b></div>
      </div>
      <h4>ผลการตรวจตามเกณฑ์</h4>
      <ul class="crit-list">${items}</ul>`;
}

function clinicPageUrl(id, evaluationId) {
  return `#clinic/${id}${evaluationId ? `/${encodeURIComponent(evaluationId)}` : ""}`;
}

function openDrawer(id, evaluationId) {
  const c = CLINICS.find((x) => x.id === id);
  if (!c) return;
  const evaluation = selectedEvaluation(c, evaluationId);
  const d = $("#drawer");
  d.innerHTML = `
    <header class="drawer-head">
      <div>
        <div class="cl-dept">${esc(c.dept)} · เข้าร่วมปีงบ ${c.joinFy}</div>
        <h2>${esc(c.name)}</h2>
        <div class="drawer-tags">${tierBadge(evaluation.tier)}</div>
      </div>
      <button class="icon-btn" id="drawer-close" aria-label="ปิด">${icon.close}</button>
    </header>
    <div class="drawer-body">
      ${evaluationSelectors(c, evaluation, false)}
      <a class="clinic-page-link" href="${clinicPageUrl(c.id, evaluation.id)}">ดูหน้ารายละเอียดศูนย์ →</a>
      ${evaluationBody(c, evaluation)}
    </div>`;

  bindEvaluationSelectors(d, c, openDrawer);
  d.classList.add("open");
  d.setAttribute("aria-hidden", "false");
  $("#drawer-backdrop").hidden = false;
  $("#drawer-close").addEventListener("click", closeDrawer);
  $("#drawer-close").focus();
}

function closeDrawer() {
  $("#drawer").classList.remove("open");
  $("#drawer").setAttribute("aria-hidden", "true");
  $("#drawer-backdrop").hidden = true;
}
$("#drawer-backdrop").addEventListener("click", closeDrawer);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

function evaluationProgress(c, selected) {
  const tierBlocks = c.evaluations.map((e) => {
    const detail = `${e.label} · ${TIERS[e.tier].code} · ${e.date || "ไม่ระบุวันที่ประเมิน"}`;
    return `<a class="evaluation-tier-block" style="background:${TIERS[e.tier].color}" href="${clinicPageUrl(c.id, e.id)}" title="${esc(detail)}" aria-label="${esc(detail)}" ${e.id === selected.id ? 'aria-current="true"' : ""}></a>`;
  }).join("");
  const cards = c.evaluations.map((e, i) => {
    const s = critSummary(e);
    const previous = c.evaluations[i - 1];
    const newlyPassed = previous ? CRITERIA.filter((k) => e.criteria[k.key][0] === "P" && previous.criteria[k.key][0] !== "P") : [];
    const noLongerPassed = previous ? CRITERIA.filter((k) => e.criteria[k.key][0] !== "P" && previous.criteria[k.key][0] === "P") : [];
    return `<a class="evaluation-step ${e.id === selected.id ? "selected" : ""}" href="${clinicPageUrl(c.id, e.id)}" ${e.id === selected.id ? 'aria-current="true"' : ""}>
      <div class="evaluation-step-head"><b>${esc(e.label)}</b>${tierBadge(e.tier)}</div>
      <small class="muted">${esc(e.date || "ไม่ระบุวันที่ประเมิน")}</small>
      <strong>${s.P}/${s.total} เกณฑ์ผ่าน · ${pct(s.P, s.total)}%</strong>
      ${segBar(e)}
      <small>บางส่วน ${s.H} · รอข้อมูล ${s.W} · ไม่ผ่าน ${s.F}</small>
      <span>${previous ? `ผ่านเพิ่ม ${newlyPassed.length} เกณฑ์${newlyPassed.length ? `: ${newlyPassed.map((k) => esc(k.short)).join(", ")}` : ""}` : "การประเมินครั้งแรก · จุดเริ่มต้นการติดตาม"}</span>
      ${noLongerPassed.length ? `<span class="t-warning">จากผ่านเป็นสถานะอื่น ${noLongerPassed.length}: ${noLongerPassed.map((k) => esc(k.short)).join(", ")}</span>` : ""}
    </a>`;
  }).join("");
  const matrix = `<div class="table-wrap"><table class="evaluation-history"><thead><tr><th>เกณฑ์การประเมิน</th>${c.evaluations.map((e) => `<th>${esc(e.label)}</th>`).join("")}</tr></thead><tbody>${CRITERIA.map((k) => `<tr><th>${esc(k.label)}</th>${c.evaluations.map((e) => {
    const [status, note] = e.criteria[k.key];
    return `<td>${pill(STATUS[status].label, STATUS[status].tone)}<small>${esc(note)}</small></td>`;
  }).join("")}</tr>`).join("")}</tbody></table></div>`;
  return `<section class="card"><h3>ความก้าวหน้าตามการประเมิน</h3>
    <nav class="evaluation-tier-history" aria-label="ระดับศูนย์ตามการประเมิน จากครั้งแรกถึงครั้งล่าสุด">${tierBlocks}</nav>
    <div class="evaluation-timeline">${cards}</div>
    <h4>ประวัติผลรายเกณฑ์</h4>${matrix}</section>`;
}

function renderClinicWorks(c) {
  const works = CLINIC_WORKS.filter((w) => w.clinic === c.name);
  if (!works.length) return '<section class="card empty">ยังไม่มีข้อมูลผลงานของศูนย์นี้ในรายการที่ได้รับ</section>';
  const fields = [
    ["owners", "เจ้าของผลงาน"], ["startYear", "ปีที่เริ่มดำเนินการ"],
    ["endYear", "ปีที่เสร็จสิ้น / ข้อความสถานะที่ระบุ"],
    ["dissemination", "รูปแบบการเผยแพร่ / วารสาร"], ["publicationYear", "ปีที่ตีพิมพ์"],
    ["researchCategory", "ประเภทงานวิจัย/R2R (ตามข้อมูลที่ระบุ)"],
    ["presentation", "การส่งเข้าร่วมนำเสนอผลงาน"], ["award", "ชื่อรางวัล"],
    ["awardOrganization", "องค์กรที่มอบรางวัล"], ["notes", "หมายเหตุ"], ["extraNotes", "หมายเหตุเพิ่มเติม"],
  ];
  return `<section class="clinic-works"><div class="card-head"><div><h3>ผลงานและงานวิจัย · ${works.length} ผลงาน</h3><p>CQI · วิจัย/R2R · นวัตกรรม · แสดงทุกปีที่มีข้อมูล</p></div></div>
    <div class="works-list">${works.map((w) => `<article class="card work-card">
      <div class="work-heading">${pill(esc(w.type), "primary")}<span class="muted">#${w.id}</span></div>
      <h3>${esc(w.title)}</h3>
      <p class="work-owner">${esc(w.owners || "ไม่ระบุเจ้าของผลงาน")}</p>
      <div class="work-years"><span>เริ่ม: <b>${esc(w.startYear || "ไม่ระบุ")}</b></span><span>เสร็จสิ้น / สถานะ: <b>${esc(w.endYear || "ไม่ระบุ")}</b></span></div>
      ${w.extraNotes ? `<p class="work-note">${esc(w.extraNotes)}</p>` : ""}
      <details class="work-details"><summary>รายละเอียดการเผยแพร่ รางวัล และข้อมูลผลงาน</summary><dl>${fields.filter(([key]) => key !== "extraNotes" || w[key]).map(([key, label]) => `<div><dt>${label}</dt><dd>${esc(w[key] || "ไม่ระบุ")}</dd></div>`).join("")}</dl></details>
    </article>`).join("")}</div></section>`;
}

function renderClinicPage(id, evaluationId, tab = "evaluation") {
  const c = CLINICS.find((x) => x.id === id);
  if (!c) {
    $("#view").innerHTML = '<section class="card empty">ไม่พบศูนย์ที่ระบุ <a href="#clinics">กลับไปศูนย์ทั้งหมด</a></section>';
    return;
  }
  const evaluation = selectedEvaluation(c, evaluationId);
  const showWorks = tab === "works";
  const worksCount = CLINIC_WORKS.filter((w) => w.clinic === c.name).length;
  const baseUrl = clinicPageUrl(c.id, evaluation.id);
  $("#crumbs").innerHTML = `COE Monitor <span>/</span> ศูนย์ทั้งหมด <span>/</span> <b>${esc(c.name)}</b>`;
  $("#view").innerHTML = `<div class="clinic-detail-page">
    <a class="back-link" href="#clinics">← กลับไปศูนย์ทั้งหมด</a>
    <div class="page-head"><div><h1>${esc(c.name)}</h1><p>${esc(c.dept)} · เข้าร่วมปีงบ ${c.joinFy} · ประเมิน ${c.evaluations.length} ครั้ง</p></div>${tierBadge(evaluation.tier)}</div>
    <nav class="clinic-view-tabs" aria-label="มุมมองข้อมูลศูนย์">
      <a href="${baseUrl}" ${!showWorks ? 'aria-current="page"' : ""}>ผลการประเมิน</a>
      <a href="${baseUrl}/works" ${showWorks ? 'aria-current="page"' : ""}>ผลงาน / งานวิจัย <span>${worksCount}</span></a>
    </nav>
    ${evaluationSelectors(c, evaluation, true, !showWorks)}
    ${showWorks ? renderClinicWorks(c) : `${evaluationProgress(c, evaluation)}
    <section class="card evaluation-detail"><h3>รายละเอียดการประเมิน · ${esc(evaluation.label)}</h3>${evaluationBody(c, evaluation)}</section>`}
  </div>`;
  bindEvaluationSelectors($("#view"), c, (clinicId, evalId) => {
    const next = CLINICS.find((x) => x.id === clinicId);
    location.hash = clinicPageUrl(clinicId, selectedEvaluation(next, evalId).id) + (showWorks ? "/works" : "");
  });
}

// ---------- Router ----------
const ROUTES = {
  overview: { title: "ภาพรวมโครงการ", render: renderOverview },
  clinics: { title: "ศูนย์ทั้งหมด", render: renderClinics },
};

function route() {
  const [key, clinicId, evaluationId, tab] = (location.hash || "#overview").slice(1).split("/");
  if (key === "clinic") {
    closeDrawer();
    document.querySelectorAll(".nav-item").forEach((a) => a.classList.toggle("active", a.dataset.route === "clinics"));
    $("#crumbs").textContent = "COE Monitor / ศูนย์ทั้งหมด";
    $(".fy").hidden = true;
    renderClinicPage(+clinicId, evaluationId, tab);
    window.scrollTo(0, 0);
    return;
  }
  $(".fy").hidden = false;
  const r = ROUTES[key] || ROUTES.overview;
  document.querySelectorAll(".nav-item").forEach((a) => a.classList.toggle("active", a.dataset.route === (ROUTES[key] ? key : "overview")));
  $("#crumbs").innerHTML = `COE Monitor <span>/</span> <b>${r.title}</b>`;
  closeDrawer();
  r.render();
  window.scrollTo(0, 0);
  if (clinicId && CLINICS.some((c) => c.id === +clinicId)) openDrawer(+clinicId);
}

const fySel = $("#fy");
fySel.innerHTML = FISCAL_YEARS.map((y) => `<option ${y === FY ? "selected" : ""}>${y}</option>`).join("");
fySel.addEventListener("change", () => { FY = +fySel.value; route(); });

window.addEventListener("hashchange", route);
route();

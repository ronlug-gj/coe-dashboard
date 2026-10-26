import { Fragment, useState } from "react";
import { TIERS, ENROLLED, FISCAL_YEARS, COE_TARGET, KPI_HISTORY, CRITERIA, STATUS, CLINICS, AS_OF } from "../dataset.js";
import { pct, MONTHS, inScope, coeSinceFy, coeBy, promotedBy, critSummary, tierClass, tierInfo, tierAt } from "../lib.js";
import { Icon, TierBadge } from "../components/common.jsx";

// Chart layers, bottom to top: enrolled clinics with no tier yet, then the tiers in ladder order.
const LAYERS = [ENROLLED, ...TIERS];

// ---------- KPI cards ----------
const HISTORY_LABELS = { P: "บรรลุเป้าหมาย", H: "บรรลุบางส่วน", W: "รอข้อมูล", F: "ไม่บรรลุเป้าหมาย" };

function KpiHistory({ fy, kpi, threshold, current }) {
  const years = FISCAL_YEARS.filter((year) => year <= fy).sort((a, b) => a - b).slice(-5);
  return (
    <div className="kpi-history">
      <small>ผลรายปีถึงปีงบ {fy}</small>
      <div className="kpi-history-years">
        {years.map((year) => {
          const value = year === fy ? current.value : kpi === "established"
            ? CLINICS.filter((c) => coeSinceFy(c) === year).length
            : KPI_HISTORY[year]?.[kpi];
          const target = kpi === "established" ? COE_TARGET[year] : threshold;
          const status = year === fy ? current.status : value == null || target == null ? "W" : value >= target ? "P" : value > 0 ? "H" : "F";
          const detail = `ปีงบ ${year}: ${HISTORY_LABELS[status]}${value == null ? "" : kpi === "established" ? ` · ${value}/${target} ศูนย์` : ` · ${value}% (เป้า ≥${target}%)`}`;
          return (
            <span key={year} className="kpi-history-year">
              <span className={`kpi-history-square s-${status}`} tabIndex={0} role="img" aria-label={detail} title={detail} />
              <small>{String(year).slice(-2)}</small>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// test(c) → true / false / null (no data)
function RateCard({ fy, kpi, label, note, clinics, test, threshold }) {
  const withData = clinics.filter((c) => test(c) !== null);
  const met = withData.filter((c) => test(c) === true).length;
  const pending = clinics.length - withData.length;
  const v = pct(met, withData.length);
  const has = withData.length > 0;
  const ok = has && v >= threshold;
  const status = !has ? "W" : ok ? "P" : met > 0 ? "H" : "F";
  return (
    <div className={`stat kpi-status s-${status}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{has ? `${v}%` : "–"}<small> {met}/{withData.length} ศูนย์</small></div>
      <KpiHistory fy={fy} kpi={kpi} threshold={threshold} current={{ value: has ? v : null, status }} />
      <div className="stat-foot">
        {!has ? <><Icon.clock /> รอข้อมูล</> : ok ? <><Icon.check /> บรรลุเป้า ≥{threshold}%</> : `ต่ำกว่าเป้า ${threshold}%`}
        {pending && has ? ` · รอข้อมูล ${pending} ศูนย์` : ""}
      </div>
      <div className="stat-note">{note}</div>
    </div>
  );
}

const metric = (k) => (c) => (c.metrics[k] === null || c.metrics[k] === undefined ? null : c.metrics[k]);
const atLeast = (k, min) => (c) => (metric(k)(c) === null ? null : c.metrics[k] >= min);

function Stats({ fy }) {
  const coe = coeBy(fy);
  const newCoe = coe.filter((c) => coeSinceFy(c) === fy).length;
  const target = COE_TARGET[fy] || 0;
  const cumTarget = FISCAL_YEARS.filter((y) => y <= fy).reduce((s, y) => s + (COE_TARGET[y] || 0), 0);
  const ok = newCoe >= target;
  const coeStatus = ok ? "P" : newCoe > 0 ? "H" : "F";
  const scopeNote = `เฉพาะ GJCOE และ iGJCOE (${coe.length} ศูนย์)`;
  const rate = { fy, clinics: coe, threshold: 80 };

  return (
    <div className="stats five">
      <div className={`stat kpi-status s-${coeStatus}`}>
        <div className="stat-label">จำนวนการจัดตั้ง COE ปีงบ {fy}</div>
        <div className="stat-value">{newCoe}<small> / เป้า {target} ศูนย์</small></div>
        <KpiHistory fy={fy} kpi="established" threshold={target} current={{ value: newCoe, status: coeStatus }} />
        <div className="stat-foot">{ok ? <><Icon.check /> บรรลุเป้าหมาย</> : `ขาดอีก ${target - newCoe} ศูนย์`}</div>
        <div className="stat-note">สะสม {coe.length}/{cumTarget} ศูนย์ · เป้า 2 ศูนย์ปีแรก จากนั้นปีละ 1</div>
      </div>
      <RateCard {...rate} kpi="growth" label="อัตราศูนย์ GJCOE ที่มีผู้รับบริการเพิ่มขึ้น ≥10%" note={`Outcome KPI · ${scopeNote}`} test={atLeast("growth", 10)} />
      <RateCard {...rate} kpi="outcome" label="อัตราศูนย์ GJCOE ที่มีผลลัพธ์การรักษาเป็นไปตามเป้าหมาย" note={`Outcome KPI · ${scopeNote}`} test={metric("outcomeMet")} />
      <RateCard {...rate} kpi="satisfaction" label="อัตราศูนย์ GJCOE ที่มีความพึงพอใจระดับดีมาก (4) ≥80%" note={scopeNote} test={atLeast("satisfaction", 80)} />
      <RateCard {...rate} kpi="research" label="อัตราศูนย์ GJCOE ที่มีงานวิจัย/R2R ≥1 เรื่อง/ศูนย์/ปี" note={scopeNote} test={atLeast("research", 1)} />
    </div>
  );
}

function TierLegend({ layers = LAYERS, children }) {
  return (
    <div className="legend-row">
      {layers.map((t) => <span key={t.code}><i className={`sw ${tierClass(t.id)}`} />{t.code}</span>)}
      {children}
    </div>
  );
}

// ---------- Area chart: clinics in program by month, by tier ----------
// Drill-down like Power BI: click a fiscal year to see just its months; drill up to return to all years.
function AreaChart({ fy }) {
  const [drillFy, setDrillFy] = useState(null);
  const years = FISCAL_YEARS.filter((y) => y <= fy);
  const drill = years.includes(drillFy) ? drillFy : null; // a drilled year past the selected FY falls back to all years
  const months = [];
  (drill ? [drill] : years).forEach((year) => MONTHS.forEach((mName, mi) => {
    const yr = String((mi < 3 ? year - 1 : year) % 100).padStart(2, "0");
    // Stop at the dataset's "today" instead of drawing flat future months.
    if (AS_OF && year === AS_OF.fy && mi > AS_OF.month) return;
    months.push({ fy: year, mi, label: `${mName} ${yr}` });
  }));
  // months between x-axis labels; every month when drilled, wider spacing for long ranges
  const labelEvery = drill ? 1 : months.length > 24 ? 6 : 3;
  // Each clinic counts under the tier it held that month, so promotions move it up the stack.
  const counts = months.map((mo) => LAYERS.map((t) => CLINICS.filter((c) => tierAt(c, mo.fy, mo.mi) === t.id).length));
  const totals = counts.map((r) => r.reduce((a, b) => a + b, 0));
  const w = 760, h = 240, pl = 30, pr = 12, pt = 16, pb = 34;
  const step = (w - pl - pr) / Math.max(1, months.length - 1);
  const x = (i) => pl + i * step;
  const last = totals.length - 1;
  // A short final fiscal year puts its "ปีงบ" label next to the total label; add headroom so they don't collide.
  const crowded = x(last) - x(months.findIndex((mo) => mo.fy === months[last].fy)) < 120;
  // Multiple of 4 so the four grid steps are whole clinic counts.
  const max = Math.max(4, Math.ceil((Math.max(...totals) + (crowded ? 2 : 0)) / 4) * 4);
  const y = (v) => h - pb - (v / max) * (h - pt - pb);

  const grid = [];
  for (let v = 0; v <= max; v += max / 4) grid.push(v);
  // stacked areas (bottom = enrolled, then AOI)
  const cum = months.map(() => 0);
  const areas = LAYERS.map((t, li) => {
    const lower = cum.slice();
    counts.forEach((r, i) => (cum[i] += r[li]));
    if (!counts.some((r) => r[li])) return null;
    const top = cum.map((v, i) => `${x(i)},${y(v)}`).join(" ");
    const bot = lower.map((v, i) => `${x(i)},${y(v)}`).reverse().join(" ");
    return <polygon key={li} points={`${top} ${bot}`} fill={t.color} fillOpacity="0.85"><title>{t.code}</title></polygon>;
  });

  const drillTo = (year) => () => setDrillFy(year);
  const onKey = (year) => (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDrillFy(year); } };
  const di = years.indexOf(drill);

  return (
    <section className="card span-7">
      <header className="card-head">
        <div>
          <h3>จำนวนศูนย์ในโครงการรายเดือน</h3>
          <p>จำแนกตามระดับ ณ แต่ละเดือน · {months[0].label} – {months[last].label}{!drill && " · คลิกที่ปีงบเพื่อดูรายเดือน"}</p>
        </div>
        {drill && (
          <nav className="drill" aria-label="เลื่อนดูรายปีงบ">
            <button onClick={drillTo(null)} title="กลับไปดูทุกปีงบ">↑ ทุกปีงบ</button>
            <button onClick={drillTo(years[di - 1])} disabled={di === 0} aria-label="ปีงบก่อนหน้า">‹</button>
            <b>ปีงบ {drill}</b>
            <button onClick={drillTo(years[di + 1])} disabled={di === years.length - 1} aria-label="ปีงบถัดไป">›</button>
          </nav>
        )}
      </header>
      <svg className="chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {grid.map((v) => (
          <Fragment key={v}>
            <line x1={pl} x2={w - pr} y1={y(v)} y2={y(v)} className="axis-grid" />
            <text x={pl - 6} y={y(v) + 4} className="axis-label" textAnchor="end">{v}</text>
          </Fragment>
        ))}
        {areas}
        <polyline points={totals.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke="#17212f" strokeWidth="1.5" />
        {months.map((mo, i) => (
          <Fragment key={i}>
            {mo.mi % labelEvery === 0 &&<text x={x(i)} y={h - pb + 16} className={`axis-label ${mo.mi === 0 ? "strong" : ""}`} textAnchor={i === last ? "end" : "middle"}>{mo.label}</text>}
            {mo.mi === 0 && i > 0 && <line x1={x(i)} x2={x(i)} y1={pt} y2={h - pb} className="fy-line" />}
            {mo.mi === 0 && (drill
              ? <text x={x(i) + 4} y={pt + 8} className="axis-label">ปีงบ {mo.fy}</text>
              : <text x={x(i) + 4} y={pt + 8} className="axis-label fy-link" role="button" tabIndex={0} onClick={drillTo(mo.fy)} onKeyDown={onKey(mo.fy)}>ปีงบ {mo.fy}</text>)}
          </Fragment>
        ))}
        <text x={x(last) - 4} y={y(totals[last]) - 6} className="bar-label strong" textAnchor="end">{totals[last]} ศูนย์</text>
        {/* Hover targets, one per month: tier breakdown tooltip, and a click drills into that month's fiscal year. */}
        {months.map((mo, i) => (
          <rect key={i} x={Math.max(pl, x(i) - step / 2)} y={pt + 12} width={Math.min(x(i) + step / 2, w - pr) - Math.max(pl, x(i) - step / 2)} height={h - pb - pt - 12}
            className={`chart-hit ${drill ? "" : "drillable"}`} onClick={drill ? undefined : drillTo(mo.fy)}>
            <title>{[`${mo.label} · รวม ${totals[i]} ศูนย์`, ...LAYERS.map((t, li) => counts[i][li] ? `${t.code}: ${counts[i][li]}` : null).filter(Boolean), drill ? null : `คลิกเพื่อดูปีงบ ${mo.fy}`].filter(Boolean).join("\n")}</title>
          </rect>
        ))}
      </svg>
      <TierLegend />
    </section>
  );
}

// ---------- Bar chart: clinics first assigned a tier per fiscal year, by that tier ----------
// history[0] is the first tier assignment, so a clinic enrolled in one year and assessed the
// next counts in the later year; clinics still waiting for a tier have no history and are left out.
const firstAssigned = (year, tier) => CLINICS.filter((c) => c.history[0]?.fy === year && c.history[0].tier === tier);

function BarChart({ fy }) {
  const years = FISCAL_YEARS;
  const data = years.map((year) => TIERS.map((t) => firstAssigned(year, t.id).length));
  const max = Math.max(4, ...data.map((r) => r.reduce((a, b) => a + b, 0)));
  const w = 420, h = 240, pl = 30, pt = 20, pb = 34;
  const y = (v) => h - pb - (v / max) * (h - pt - pb);
  const bw = (w - pl) / years.length;
  // Narrow bars (many fiscal years) can't fit clinic names; those move into hover titles.
  const roomy = bw >= 120;

  const grid = [];
  for (let v = 0; v <= max; v++) grid.push(v);

  return (
    <section className="card span-5">
      <header className="card-head"><div>
        <h3>จำนวน COE จัดตั้งใหม่รายปีงบประมาณ</h3>
        <p>ศูนย์ที่ได้รับการจัดระดับครั้งแรกในแต่ละปีงบ · จำแนกตามระดับที่ได้รับ</p>
      </div></header>
      <svg className="chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {grid.map((v) => (
          <Fragment key={v}>
            <line x1={pl} x2={w} y1={y(v)} y2={y(v)} className="axis-grid" />
            <text x={pl - 6} y={y(v) + 4} className="axis-label" textAnchor="end">{v}</text>
          </Fragment>
        ))}
        {years.map((year, i) => {
          const x0 = pl + i * bw + bw * 0.25, bwi = bw * 0.5;
          let acc = 0;
          const segments = TIERS.map((t) => {
            const n = data[i][t.id];
            if (!n) return null;
            const base = acc;
            acc += n;
            const joined = firstAssigned(year, t.id);
            return (
              <Fragment key={t.id}>
                <rect x={x0} y={y(base + n)} width={bwi} height={y(base) - y(base + n)} fill={t.color}>
                  <title>{t.code}: {n} ศูนย์{!roomy && ` (${joined.map((c) => c.name).join(", ")})`}</title>
                </rect>
                {roomy && joined.map((c, j) => (
                  <text key={c.id} x={x0 + bwi / 2} y={(y(base + j) + y(base + j + 1)) / 2 + 4} className="seg-label" textAnchor="middle">{c.name}</text>
                ))}
              </Fragment>
            );
          });
          return (
            <Fragment key={year}>
              {segments}
              <text x={x0 + bwi / 2} y={y(acc) - 6} className="bar-label strong" textAnchor="middle">{acc}</text>
              <text x={x0 + bwi / 2} y={h - 12} className={`axis-label ${year === fy ? "strong" : ""}`} textAnchor="middle">ปีงบ {year}</text>
            </Fragment>
          );
        })}
      </svg>
      <TierLegend layers={TIERS} />
    </section>
  );
}

// ---------- Heatmap: audit criteria × clinic + pass rate by tier ----------
function RateCell({ n, d, req, extra = "" }) {
  if (!d) return <td className="hm-rate na">–</td>;
  const v = pct(n, d);
  return (
    <td className="hm-rate" style={{ "--a": (0.08 + 0.72 * v / 100).toFixed(2) }} title={`${n}/${d}${extra}`}>
      {v}%{req && <small>{req}</small>}
    </td>
  );
}

function Heatmap({ fy, hmClinic, onHmClinic, onOpenClinic }) {
  // Clinics still waiting for their first tier (กำลังจัดระดับ) have no audit results yet, so they're left out.
  const all = inScope(fy).filter((c) => c.tier !== null).sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name));
  const selected = hmClinic !== "all" && all.some((c) => c.id === +hmClinic) ? hmClinic : "all";
  const clinics = selected === "all" ? all : all.filter((c) => c.id === +selected);
  const tiers = [...TIERS].reverse(); // iGJCOE … AOI
  const groups = tiers.map((t) => ({ t, list: clinics.filter((c) => c.tier === t.id) })).filter((g) => g.list.length);
  const groupClinics = groups.flatMap((g) => g.list);

  return (
    <section className="card span-12">
      <header className="card-head">
        <div>
          <h3>ผลการตรวจประเมินตามเกณฑ์ COE</h3>
          <p>ผลการตรวจรายศูนย์ และอัตราการผ่านเกณฑ์ของศูนย์ที่เลือก · คลิกชื่อศูนย์เพื่อดูรายละเอียด</p>
        </div>
        <div className="hm-tools">
          <label className="slicer">ศูนย์
            <select value={selected} onChange={(e) => onHmClinic(e.target.value)}>
              <option value="all">ทุกศูนย์ ({all.length})</option>
              {all.map((c) => <option key={c.id} value={c.id}>{c.name} · {tierInfo(c.tier).code}</option>)}
            </select>
          </label>
          <div className="legend-row tight">
            {/* รอข้อมูล only applies to clinics not yet assigned a tier, which this heatmap leaves out. */}
            {Object.entries(STATUS).filter(([k]) => k !== "W").map(([k, v]) => <span key={k}><i className={`sw s-${k}`} />{v.label}</span>)}
          </div>
        </div>
      </header>
      <div className="table-wrap">
        <table className="heatmap">
          <thead>
            <tr>
              <th rowSpan={2} className="hm-crit">เกณฑ์</th>
              <th rowSpan={2} className="hm-method">การประเมิน</th>
              {groups.map((g) => <th key={g.t.id} colSpan={g.list.length} className="hm-group"><TierBadge tier={g.t.id} size="sm" /></th>)}
              <th rowSpan={2} className="hm-group rate">อัตราผ่านเกณฑ์<small>{clinics.length} ศูนย์ที่เลือก</small></th>
            </tr>
            <tr>
              {groupClinics.map((c) => <th key={c.id} className="hm-clinic"><button title={c.name} onClick={() => onOpenClinic(c.id)}>{c.name}</button></th>)}
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((k) => (
              <tr key={k.key}>
                <th className="hm-crit">{k.label}</th>
                <td className="hm-method">{k.method}</td>
                {groupClinics.map((c) => {
                  const [st, txt] = c.criteria[k.key];
                  // Colour only; the result text shows on hover.
                  const detail = `${c.name} · ${k.label}: ${txt} (${STATUS[st].label})`;
                  return <td key={c.id} className={`hm-cell s-${st}`} title={detail} aria-label={detail} />;
                })}
                {(() => {
                  // Share of the selected clinics whose own result for this criterion is ผ่าน.
                  const passed = clinics.filter((c) => c.criteria[k.key][0] === "P").length;
                  return <RateCell n={passed} d={clinics.length} />;
                })()}
              </tr>
            ))}
            <tr className="hm-foot">
              <th className="hm-crit">ผ่านเกณฑ์รวม</th>
              <td className="hm-method">ร้อยละ</td>
              {groupClinics.map((c) => {
                const s = critSummary(c);
                return <td key={c.id} className="hm-sum"><b>{pct(s.P, s.total)}%</b><small>{s.P}/{s.total}</small></td>;
              })}
              <RateCell n={clinics.reduce((a, c) => a + critSummary(c).P, 0)} d={CRITERIA.length * clinics.length} req={`${CRITERIA.length} เกณฑ์`} />
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------- Overview ----------
export default function Overview({ fy, hmClinic, onHmClinic, onOpenClinic }) {
  const scope = inScope(fy);
  const promoted = promotedBy(fy).length;
  return (
    <>
      <div className="page-head"><div>
        <h1>ภาพรวมโครงการ</h1>
        <p>ปีงบประมาณ {fy} · {scope.length} ศูนย์ในโครงการ · COE (GJCOE ขึ้นไป) {coeBy(fy).length} ศูนย์ · {promoted ? `เลื่อนระดับแล้ว ${promoted} ศูนย์` : "ยังไม่มีศูนย์ที่เลื่อนระดับ"}</p>
      </div></div>
      <h2 className="section-title">ตัวชี้วัดโครงการ</h2>
      <Stats fy={fy} />
      <h2 className="section-title">การเติบโตของโครงการ</h2>
      <div className="grid"><AreaChart fy={fy} /><BarChart fy={fy} /></div>
      <h2 className="section-title">ผลการตรวจประเมินศูนย์</h2>
      <div className="grid">
        <Heatmap fy={fy} hmClinic={hmClinic} onHmClinic={onHmClinic} onOpenClinic={onOpenClinic} />
      </div>
    </>
  );
}

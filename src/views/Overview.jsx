import { Fragment } from "react";
import { TIERS, FISCAL_YEARS, COE_TARGET, KPI_HISTORY, CRITERIA, STATUS, CLINICS, TIER_REQ } from "../data.js";
import { pct, MONTHS, isCOE, inScope, critSummary, tierStatus } from "../lib.js";
import { Icon, TierBadge } from "../components/common.jsx";

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
            ? CLINICS.filter((c) => c.joinFy === year && c.history[0].tier >= 2).length
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
  const coe = inScope(fy).filter(isCOE);
  const newCoe = coe.filter((c) => c.joinFy === fy).length;
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

function TierLegend({ children }) {
  return (
    <div className="legend-row">
      {TIERS.map((t) => <span key={t.id}><i className={`sw t${t.id}`} />{t.code}</span>)}
      {children}
    </div>
  );
}

// ---------- Area chart: clinics in program by month, by tier ----------
function AreaChart({ fy }) {
  const months = [];
  FISCAL_YEARS.filter((y) => y <= fy).forEach((year) => MONTHS.forEach((mName, mi) => {
    const yr = String((mi < 3 ? year - 1 : year) % 100).padStart(2, "0");
    months.push({ fy: year, mi, label: `${mName} ${yr}` });
  }));
  const counts = months.map((mo) => TIERS.map((t) => CLINICS.filter((c) =>
    c.tier === t.id && (c.joinFy < mo.fy || (c.joinFy === mo.fy && c.joinMonth <= mo.mi))).length));
  const totals = counts.map((r) => r.reduce((a, b) => a + b, 0));
  const max = Math.max(4, Math.ceil(Math.max(...totals) / 2) * 2);

  const w = 760, h = 240, pl = 30, pr = 12, pt = 16, pb = 34;
  const x = (i) => pl + (i * (w - pl - pr)) / (months.length - 1);
  const y = (v) => h - pb - (v / max) * (h - pt - pb);

  const grid = [];
  for (let v = 0; v <= max; v += max / 4) grid.push(v);
  // stacked areas (bottom = AOI)
  const cum = months.map(() => 0);
  const areas = TIERS.map((t) => {
    const lower = cum.slice();
    counts.forEach((r, i) => (cum[i] += r[t.id]));
    if (!counts.some((r) => r[t.id])) return null;
    const top = cum.map((v, i) => `${x(i)},${y(v)}`).join(" ");
    const bot = lower.map((v, i) => `${x(i)},${y(v)}`).reverse().join(" ");
    return <polygon key={t.id} points={`${top} ${bot}`} fill={t.color} fillOpacity="0.85"><title>{t.code}</title></polygon>;
  });
  const last = totals.length - 1;

  return (
    <section className="card span-7">
      <header className="card-head"><div>
        <h3>จำนวนศูนย์ในโครงการรายเดือน</h3>
        <p>จำแนกตามระดับปัจจุบัน · ต.ค. {(FISCAL_YEARS[0] - 1) % 100} – ก.ย. {fy % 100}</p>
      </div></header>
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
            {mo.mi % 3 === 0 && <text x={x(i)} y={h - pb + 16} className={`axis-label ${mo.mi === 0 ? "strong" : ""}`} textAnchor="middle">{mo.label}</text>}
            {mo.mi === 0 && i > 0 && <line x1={x(i)} x2={x(i)} y1={pt} y2={h - pb} className="fy-line" />}
            {mo.mi === 0 && <text x={x(i) + 4} y={pt + 8} className="axis-label">ปีงบ {mo.fy}</text>}
          </Fragment>
        ))}
        <text x={x(last) - 4} y={y(totals[last]) - 6} className="bar-label strong" textAnchor="end">{totals[last]} ศูนย์</text>
      </svg>
      <TierLegend />
    </section>
  );
}

// ---------- Bar chart: new COE per fiscal year by tier ----------
function BarChart({ fy }) {
  const years = FISCAL_YEARS;
  const data = years.map((year) => TIERS.map((t) => CLINICS.filter((c) => c.joinFy === year && c.tier === t.id).length));
  const max = Math.max(4, ...data.map((r) => r.reduce((a, b) => a + b, 0)), ...years.map((y) => COE_TARGET[y] || 0));
  const w = 420, h = 240, pl = 30, pt = 20, pb = 34;
  const y = (v) => h - pb - (v / max) * (h - pt - pb);
  const bw = (w - pl) / years.length;

  const grid = [];
  for (let v = 0; v <= max; v++) grid.push(v);

  return (
    <section className="card span-5">
      <header className="card-head"><div>
        <h3>จำนวน COE จัดตั้งใหม่รายปีงบประมาณ</h3>
        <p>จำแนกตามระดับ GJCOE · เส้นประ = เป้าหมาย COE (GJCOE ขึ้นไป)</p>
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
            return (
              <Fragment key={t.id}>
                <rect x={x0} y={y(base + n)} width={bwi} height={y(base) - y(base + n)} fill={t.color}><title>{t.code}: {n} ศูนย์</title></rect>
                {CLINICS.filter((c) => c.joinFy === year && c.tier === t.id).map((c, j) => (
                  <text key={c.id} x={x0 + bwi / 2} y={(y(base + j) + y(base + j + 1)) / 2 + 4} className="seg-label" textAnchor="middle">{c.name}</text>
                ))}
              </Fragment>
            );
          });
          const tg = COE_TARGET[year] || 0;
          return (
            <Fragment key={year}>
              {segments}
              <line x1={x0 - 8} x2={x0 + bwi + 8} y1={y(tg)} y2={y(tg)} className="target-line" />
              <text x={x0 + bwi + 10} y={y(tg) + 4} className="axis-label">เป้า COE {tg}</text>
              <text x={x0 + bwi / 2} y={y(acc) - 6} className="bar-label strong" textAnchor="middle">{acc}</text>
              <text x={x0 + bwi / 2} y={h - 12} className={`axis-label ${year === fy ? "strong" : ""}`} textAnchor="middle">ปีงบ {year}</text>
            </Fragment>
          );
        })}
      </svg>
      <TierLegend><span><i className="sw target" />เป้าหมาย</span></TierLegend>
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
  const all = inScope(fy).slice().sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name));
  const selected = hmClinic !== "all" && all.some((c) => c.id === +hmClinic) ? hmClinic : "all";
  const clinics = selected === "all" ? all : all.filter((c) => c.id === +selected);
  const tiers = TIERS.slice().reverse();
  const reqTiers = TIERS.filter((t) => t.id > 0); // AOI has no requirements; order dGJCOE → GJCOE → iGJCOE
  const groups = tiers.map((t) => ({ t, list: clinics.filter((c) => c.tier === t.id) })).filter((g) => g.list.length);
  const groupClinics = groups.flatMap((g) => g.list);

  return (
    <section className="card span-12">
      <header className="card-head">
        <div>
          <h3>ผลการตรวจประเมินตามเกณฑ์ COE</h3>
          <p>ผลการตรวจรายศูนย์ และอัตราการผ่านเกณฑ์แยกตามระดับ · คลิกชื่อศูนย์เพื่อดูรายละเอียด</p>
        </div>
        <div className="hm-tools">
          <label className="slicer">ศูนย์
            <select value={selected} onChange={(e) => onHmClinic(e.target.value)}>
              <option value="all">ทุกศูนย์ ({all.length})</option>
              {all.map((c) => <option key={c.id} value={c.id}>{c.name} · {TIERS[c.tier].code}</option>)}
            </select>
          </label>
          <div className="legend-row tight">
            {Object.entries(STATUS).map(([k, v]) => <span key={k}><i className={`sw s-${k}`} />{v.label}</span>)}
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
              <th colSpan={reqTiers.length} className="hm-group rate">อัตราผ่านเกณฑ์ตามระดับ <small>({clinics.length} ศูนย์ที่เลือก)</small></th>
            </tr>
            <tr>
              {groupClinics.map((c) => <th key={c.id} className="hm-clinic"><button onClick={() => onOpenClinic(c.id)}>{c.name}</button></th>)}
              {reqTiers.map((t) => <th key={t.id} className="hm-clinic">{t.code}</th>)}
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((k) => (
              <tr key={k.key}>
                <th className="hm-crit">{k.label}</th>
                <td className="hm-method">{k.method}</td>
                {groupClinics.map((c) => {
                  const [st, txt] = c.criteria[k.key];
                  return <td key={c.id} className={`hm-cell s-${st}`} title={`${c.name} · ${STATUS[st].label}`}>{txt}</td>;
                })}
                {reqTiers.map((t) => {
                  const req = TIER_REQ[k.key][t.id];
                  if (!req) return <td key={t.id} className="hm-rate na" title={`ไม่ใช่เกณฑ์ของระดับ ${t.code}`}>–</td>;
                  const res = clinics.map((c) => tierStatus(c, k.key, t.id));
                  const w = res.filter((s) => s === "W").length;
                  return <RateCell key={t.id} n={res.filter((s) => s === "P").length} d={clinics.length} req={req} extra={w ? ` · รอข้อมูล ${w}` : ""} />;
                })}
              </tr>
            ))}
            <tr className="hm-foot">
              <th className="hm-crit">ผ่านเกณฑ์รวม</th>
              <td className="hm-method">ร้อยละ</td>
              {groupClinics.map((c) => {
                const s = critSummary(c);
                return <td key={c.id} className="hm-sum"><b>{pct(s.P, s.total)}%</b><small>{s.P}/{s.total}</small></td>;
              })}
              {reqTiers.map((t) => {
                const keys = CRITERIA.filter((k) => TIER_REQ[k.key][t.id]);
                const met = clinics.reduce((a, c) => a + keys.filter((k) => tierStatus(c, k.key, t.id) === "P").length, 0);
                return <RateCell key={t.id} n={met} d={keys.length * clinics.length} req={`${keys.length} เกณฑ์`} />;
              })}
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
  return (
    <>
      <div className="page-head"><div>
        <h1>ภาพรวมโครงการ</h1>
        <p>ปีงบประมาณ {fy} · {scope.length} ศูนย์ในโครงการ · COE (GJCOE ขึ้นไป) {scope.filter(isCOE).length} ศูนย์ · ยังไม่มีศูนย์ที่เลื่อนระดับ</p>
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

import { useRef } from "react";
import { TIERS, CRITERIA } from "../dataset.js";
import { inScope, critSummary } from "../lib.js";
import { SegBar, TierBadge } from "../components/common.jsx";

export const INITIAL_LIST_STATE = { tier: "all", q: "", criteria: [], sort: "tier", direction: "desc" };

const CLINIC_COLUMNS = [
  { key: "name", label: "ศูนย์" },
  { key: "tier", label: "ระดับปัจจุบัน" },
  { key: "joinFy", label: "ปีที่เข้าร่วม" },
  { key: "passed", label: `ผลการตรวจ (${CRITERIA.length} เกณฑ์)`, hint: "จำนวนเกณฑ์ที่ผ่าน" },
  { key: "unmet", label: "ยังไม่ผ่าน", hint: "จำนวนเกณฑ์ที่ไม่ผ่านหรือผ่านบางส่วน" },
];

function compareClinics(listState) {
  const value = (c) => {
    const s = critSummary(c);
    return ({ name: c.name, tier: c.tier, joinFy: c.joinFy, passed: s.P, unmet: s.F + s.H })[listState.sort];
  };
  return (a, b) => {
    const av = value(a), bv = value(b);
    const result = typeof av === "string" ? av.localeCompare(bv, "th", { numeric: true, sensitivity: "base" }) : av - bv;
    return result * (listState.direction === "asc" ? 1 : -1) ||
      (listState.sort === "tier" ? critSummary(b).P - critSummary(a).P : 0) ||
      a.name.localeCompare(b.name, "th") || a.id - b.id;
  };
}

function criteriaSelectionLabel(selected) {
  return selected.length ? `เลือก ${selected.length} เกณฑ์: ${CRITERIA.filter((k) => selected.includes(k.key)).map((k) => k.short).join(", ")}` : "ทุกเกณฑ์ (ไม่กรอง)";
}

function ClinicRow({ clinic: c, onOpen }) {
  const s = critSummary(c);
  const fails = CRITERIA.filter((k) => ["F", "H"].includes(c.criteria[k.key][0]));
  return (
    <tr tabIndex={0} onClick={() => onOpen(c.id)} onKeyDown={(e) => { if (e.key === "Enter") onOpen(c.id); }}>
      <td><div className="cl-name">{c.name}</div><div className="cl-dept">{c.dept}</div></td>
      <td><TierBadge tier={c.tier} /></td>
      <td>ปีงบ {c.joinFy}</td>
      <td><div className="prog"><SegBar clinic={c} /><span className="prog-text"><b>{s.P}/{s.total}</b> ผ่าน</span></div></td>
      <td>
        <div className="chips">
          {c.tier === null ? <span className="muted">รอการประเมินเพื่อจัดระดับ</span> : fails.length ? (
            <>
              {fails.slice(0, 4).map((k) => <span key={k.key} className={`chip ${c.criteria[k.key][0] === "F" ? "chip-kpi" : ""}`}>{k.short}</span>)}
              {fails.length > 4 && <span className="chip more">+{fails.length - 4}</span>}
            </>
          ) : <span className="muted">—</span>}
        </div>
      </td>
    </tr>
  );
}

export default function Clinics({ fy, listState, onListState, onOpenClinic }) {
  const pickerRef = useRef(null);
  const update = (patch) => onListState({ ...listState, ...patch });
  const scope = inScope(fy);
  const q = listState.q.trim().toLowerCase();
  const rows = scope.filter((c) =>
    (listState.tier === "all" || c.tier === +listState.tier) &&
    (!listState.criteria.length || listState.criteria.some((key) => c.criteria[key][0] !== "P")) &&
    (!q || c.name.toLowerCase().includes(q) || c.dept.toLowerCase().includes(q)))
    .sort(compareClinics(listState));

  const toggleCriterion = (key, checked) =>
    update({ criteria: CRITERIA.map((k) => k.key).filter((k) => (k === key ? checked : listState.criteria.includes(k))) });

  const sortBy = (key) => update({
    sort: key,
    direction: listState.sort === key && listState.direction === "asc" ? "desc" : "asc",
  });

  return (
    <>
      <div className="page-head"><div>
        <h1>ศูนย์ทั้งหมด</h1>
        <p>ผลการตรวจประเมินรายศูนย์ · คลิกแถวเพื่อดูรายละเอียด</p>
      </div></div>
      <div className="tier-cards">
        <button className={`tier-card ${listState.tier === "all" ? "active" : ""}`} onClick={() => update({ tier: "all" })}>
          <span className="tc-label">ทั้งหมด</span><span className="tc-value">{scope.length}</span><span className="tc-foot muted">ศูนย์ในโครงการ</span>
        </button>
        {TIERS.map((t) => (
          <button key={t.id} className={`tier-card t${t.id} ${String(listState.tier) === String(t.id) ? "active" : ""}`} onClick={() => update({ tier: String(t.id) })}>
            <span className="tc-label"><TierBadge tier={t.id} size="sm" /> <small>{t.name}</small></span>
            <span className="tc-value">{scope.filter((c) => c.tier === t.id).length}</span>
            <span className="tc-foot muted">ศูนย์</span>
          </button>
        ))}
      </div>
      <div className="card table-card">
        <div className="toolbar">
          <div className="search">
            <svg viewBox="0 0 24 24"><path d="M10 4a6 6 0 104.47 10l4.76 4.77 1.06-1.06-4.76-4.77A6 6 0 0010 4zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" /></svg>
            <input type="search" placeholder="ค้นหาศูนย์หรือแผนก" value={listState.q} onChange={(e) => update({ q: e.target.value })} />
          </div>
          <div className="criteria-filter">
            <span id="criteria-filter-label">เกณฑ์ที่ยังไม่ผ่าน</span>
            <details
              ref={pickerRef}
              className="criteria-picker"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  pickerRef.current.open = false;
                  pickerRef.current.querySelector("summary").focus();
                }
              }}
            >
              <summary aria-describedby="criteria-filter-label criteria-filter-help"><span>{criteriaSelectionLabel(listState.criteria)}</span></summary>
              <div className="criteria-options">
                <button type="button" onClick={() => update({ criteria: [] })}>ล้างการเลือก</button>
                <div role="group" aria-labelledby="criteria-filter-label">
                  {CRITERIA.map((k) => (
                    <label key={k.key}>
                      <input type="checkbox" value={k.key} checked={listState.criteria.includes(k.key)} onChange={(e) => toggleCriterion(k.key, e.target.checked)} />
                      {k.label}
                    </label>
                  ))}
                </div>
              </div>
            </details>
            <small id="criteria-filter-help">ตรงอย่างน้อย 1 เกณฑ์ที่เลือก · รวมไม่ผ่านและผ่านบางส่วน</small>
          </div>
          <span className="result-count" aria-live="polite">{rows.length} ศูนย์</span>
        </div>
        <div className="table-wrap">
          <table className="clinic-table">
            <thead>
              <tr>
                {CLINIC_COLUMNS.map((col) => {
                  const active = col.key === listState.sort;
                  const asc = listState.direction === "asc";
                  return (
                    <th key={col.key} scope="col" aria-sort={active ? (asc ? "ascending" : "descending") : "none"}>
                      <button
                        className="column-sort"
                        title={`เรียงตาม${col.hint || col.label}`}
                        aria-label={`${col.label}: เรียง${active && asc ? "จากมากไปน้อย" : "จากน้อยไปมาก"}`}
                        onClick={() => sortBy(col.key)}
                      >
                        {col.label} <span className="sort-icon" aria-hidden="true">{active ? (asc ? "↑" : "↓") : "↕"}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.length
                ? rows.map((c) => <ClinicRow key={c.id} clinic={c} onOpen={onOpenClinic} />)
                : <tr><td colSpan={CLINIC_COLUMNS.length} className="empty">ไม่พบศูนย์ตามเงื่อนไข</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

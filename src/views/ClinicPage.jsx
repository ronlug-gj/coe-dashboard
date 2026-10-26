import { TIERS, CRITERIA, STATUS, CLINICS } from "../data.js";
import { CLINIC_WORKS } from "../works.js";
import { pct, critSummary, selectedEvaluation, clinicPageUrl } from "../lib.js";
import { Pill, SegBar, TierBadge } from "../components/common.jsx";
import { EvaluationBody, EvaluationSelectors } from "../components/Evaluation.jsx";

const current = (yes) => (yes ? "true" : undefined);

function EvaluationProgress({ clinic: c, selected }) {
  return (
    <section className="card">
      <h3>ความก้าวหน้าตามการประเมิน</h3>
      <nav className="evaluation-tier-history" aria-label="ระดับศูนย์ตามการประเมิน จากครั้งแรกถึงครั้งล่าสุด">
        {c.evaluations.map((e) => {
          const detail = `${e.label} · ${TIERS[e.tier].code} · ${e.date || "ไม่ระบุวันที่ประเมิน"}`;
          return <a key={e.id} className="evaluation-tier-block" style={{ background: TIERS[e.tier].color }} href={clinicPageUrl(c.id, e.id)} title={detail} aria-label={detail} aria-current={current(e.id === selected.id)} />;
        })}
      </nav>
      <div className="evaluation-timeline">
        {c.evaluations.map((e, i) => {
          const s = critSummary(e);
          const previous = c.evaluations[i - 1];
          const newlyPassed = previous ? CRITERIA.filter((k) => e.criteria[k.key][0] === "P" && previous.criteria[k.key][0] !== "P") : [];
          const noLongerPassed = previous ? CRITERIA.filter((k) => e.criteria[k.key][0] !== "P" && previous.criteria[k.key][0] === "P") : [];
          return (
            <a key={e.id} className={`evaluation-step ${e.id === selected.id ? "selected" : ""}`} href={clinicPageUrl(c.id, e.id)} aria-current={current(e.id === selected.id)}>
              <div className="evaluation-step-head"><b>{e.label}</b><TierBadge tier={e.tier} /></div>
              <small className="muted">{e.date || "ไม่ระบุวันที่ประเมิน"}</small>
              <strong>{s.P}/{s.total} เกณฑ์ผ่าน · {pct(s.P, s.total)}%</strong>
              <SegBar clinic={e} />
              <small>บางส่วน {s.H} · รอข้อมูล {s.W} · ไม่ผ่าน {s.F}</small>
              <span>{previous
                ? `ผ่านเพิ่ม ${newlyPassed.length} เกณฑ์${newlyPassed.length ? `: ${newlyPassed.map((k) => k.short).join(", ")}` : ""}`
                : "การประเมินครั้งแรก · จุดเริ่มต้นการติดตาม"}</span>
              {noLongerPassed.length > 0 && <span className="t-warning">จากผ่านเป็นสถานะอื่น {noLongerPassed.length}: {noLongerPassed.map((k) => k.short).join(", ")}</span>}
            </a>
          );
        })}
      </div>
      <h4>ประวัติผลรายเกณฑ์</h4>
      <div className="table-wrap">
        <table className="evaluation-history">
          <thead><tr><th>เกณฑ์การประเมิน</th>{c.evaluations.map((e) => <th key={e.id}>{e.label}</th>)}</tr></thead>
          <tbody>
            {CRITERIA.map((k) => (
              <tr key={k.key}>
                <th>{k.label}</th>
                {c.evaluations.map((e) => {
                  const [status, note] = e.criteria[k.key];
                  return <td key={e.id}><Pill tone={STATUS[status].tone}>{STATUS[status].label}</Pill><small>{note}</small></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const WORK_FIELDS = [
  ["owners", "เจ้าของผลงาน"], ["startYear", "ปีที่เริ่มดำเนินการ"],
  ["endYear", "ปีที่เสร็จสิ้น / ข้อความสถานะที่ระบุ"],
  ["dissemination", "รูปแบบการเผยแพร่ / วารสาร"], ["publicationYear", "ปีที่ตีพิมพ์"],
  ["researchCategory", "ประเภทงานวิจัย/R2R (ตามข้อมูลที่ระบุ)"],
  ["presentation", "การส่งเข้าร่วมนำเสนอผลงาน"], ["award", "ชื่อรางวัล"],
  ["awardOrganization", "องค์กรที่มอบรางวัล"], ["notes", "หมายเหตุ"], ["extraNotes", "หมายเหตุเพิ่มเติม"],
];

function ClinicWorks({ works }) {
  if (!works.length) return <section className="card empty">ยังไม่มีข้อมูลผลงานของศูนย์นี้ในรายการที่ได้รับ</section>;
  return (
    <section className="clinic-works">
      <div className="card-head"><div><h3>ผลงานและงานวิจัย · {works.length} ผลงาน</h3><p>CQI · วิจัย/R2R · นวัตกรรม · แสดงทุกปีที่มีข้อมูล</p></div></div>
      <div className="works-list">
        {works.map((w) => (
          <article key={w.id} className="card work-card">
            <div className="work-heading"><Pill tone="primary">{w.type}</Pill><span className="muted">#{w.id}</span></div>
            <h3>{w.title}</h3>
            <p className="work-owner">{w.owners || "ไม่ระบุเจ้าของผลงาน"}</p>
            <div className="work-years"><span>เริ่ม: <b>{w.startYear || "ไม่ระบุ"}</b></span><span>เสร็จสิ้น / สถานะ: <b>{w.endYear || "ไม่ระบุ"}</b></span></div>
            {w.extraNotes && <p className="work-note">{w.extraNotes}</p>}
            <details className="work-details">
              <summary>รายละเอียดการเผยแพร่ รางวัล และข้อมูลผลงาน</summary>
              <dl>
                {WORK_FIELDS.filter(([key]) => key !== "extraNotes" || w[key]).map(([key, label]) => (
                  <div key={key}><dt>{label}</dt><dd>{w[key] || "ไม่ระบุ"}</dd></div>
                ))}
              </dl>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ClinicPage({ clinic: c, evaluationId, tab = "evaluation" }) {
  if (!c) return <section className="card empty">ไม่พบศูนย์ที่ระบุ <a href="#clinics">กลับไปศูนย์ทั้งหมด</a></section>;
  const evaluation = selectedEvaluation(c, evaluationId);
  const showWorks = tab === "works";
  const works = CLINIC_WORKS.filter((w) => w.clinic === c.name);
  const baseUrl = clinicPageUrl(c.id, evaluation.id);
  const select = (clinicId, evalId) => {
    const next = CLINICS.find((x) => x.id === clinicId);
    location.hash = clinicPageUrl(clinicId, selectedEvaluation(next, evalId).id) + (showWorks ? "/works" : "");
  };

  return (
    <div className="clinic-detail-page">
      <a className="back-link" href="#clinics">← กลับไปศูนย์ทั้งหมด</a>
      <div className="page-head">
        <div><h1>{c.name}</h1><p>{c.dept} · เข้าร่วมปีงบ {c.joinFy} · ประเมิน {c.evaluations.length} ครั้ง</p></div>
        <TierBadge tier={evaluation.tier} />
      </div>
      <nav className="clinic-view-tabs" aria-label="มุมมองข้อมูลศูนย์">
        <a href={baseUrl} aria-current={!showWorks ? "page" : undefined}>ผลการประเมิน</a>
        <a href={`${baseUrl}/works`} aria-current={showWorks ? "page" : undefined}>ผลงาน / งานวิจัย <span>{works.length}</span></a>
      </nav>
      <EvaluationSelectors clinic={c} evaluation={evaluation} showEvaluation={!showWorks} onSelect={select} />
      {showWorks ? <ClinicWorks works={works} /> : (
        <>
          <EvaluationProgress clinic={c} selected={evaluation} />
          <section className="card evaluation-detail">
            <h3>รายละเอียดการประเมิน · {evaluation.label}</h3>
            <EvaluationBody clinic={c} evaluation={evaluation} />
          </section>
        </>
      )}
    </div>
  );
}

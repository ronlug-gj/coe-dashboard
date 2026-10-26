import { TIERS, CRITERIA, STATUS, CLINICS } from "../data.js";
import { critSummary } from "../lib.js";
import { Pill } from "./common.jsx";

// onSelect(clinicId, evaluationId?) — evaluationId is omitted when the clinic changes.
export function EvaluationSelectors({ clinic, evaluation, onSelect, showClinic = true, showEvaluation = true }) {
  return (
    <div className="evaluation-selectors">
      {showClinic && (
        <label>ศูนย์
          <select value={clinic.id} onChange={(e) => onSelect(+e.target.value)}>
            {CLINICS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
      )}
      {showEvaluation && (
        <label>การประเมิน
          <select value={evaluation.id} onChange={(e) => onSelect(clinic.id, e.target.value)}>
            {clinic.evaluations.map((e) => (
              <option key={e.id} value={e.id}>{e.label}{e.date ? ` · ${e.date}` : " · ไม่ระบุวันที่"}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

const Waiting = () => <span className="muted">รอข้อมูล</span>;
const metricValue = (v, unit) => (v === null || v === undefined ? <Waiting /> : `${v}${unit}`);

export function EvaluationBody({ clinic, evaluation }) {
  const c = { ...clinic, ...evaluation };
  const s = critSummary(c);
  return (
    <>
      <div className="ladder">
        {TIERS.map((t) => (
          <div key={t.id} className={`ladder-step ${t.id <= c.tier ? "done" : ""} ${t.id === c.tier ? "current" : ""} t${t.id}`}>
            <span className="ladder-dot" /><span className="ladder-code">{t.code}</span><span className="ladder-name">{t.name}</span>
          </div>
        ))}
      </div>
      <div className="mini-stats">
        <div><span>ผ่านเกณฑ์</span><b>{s.P}/{s.total}</b></div>
        <div><span>ผ่านบางส่วน</span><b>{s.H}</b></div>
        <div><span>รอข้อมูล</span><b>{s.W}</b></div>
        <div><span>ไม่ผ่าน</span><b>{s.F}</b></div>
      </div>
      <h4>ตัวชี้วัดผลลัพธ์</h4>
      <div className="mini-stats">
        <div><span>ผู้รับบริการเพิ่มขึ้น</span><b>{metricValue(c.metrics.growth, "%")}</b></div>
        <div><span>ผลลัพธ์การรักษา</span><b>{c.metrics.outcomeMet == null ? <Waiting /> : c.metrics.outcomeMet ? "ตามเป้า" : "ไม่ตามเป้า"}</b></div>
        <div><span>พึงพอใจระดับ 4</span><b>{metricValue(c.metrics.satisfaction, "%")}</b></div>
        <div><span>วิจัย/R2R</span><b>{metricValue(c.metrics.research, " เรื่อง")}</b></div>
      </div>
      <h4>ผลการตรวจตามเกณฑ์</h4>
      <ul className="crit-list">
        {CRITERIA.map((k) => {
          const [st, txt] = c.criteria[k.key];
          return (
            <li key={k.key} className="crit-item">
              <span className={`hm-dot s-${st}`} />
              <span className="ci-label">{k.label}<small>{txt}</small></span>
              <Pill tone={STATUS[st].tone}>{STATUS[st].label}</Pill>
            </li>
          );
        })}
      </ul>
    </>
  );
}

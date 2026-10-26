import { useEffect, useRef } from "react";
import { CLINICS } from "../data.js";
import { clinicPageUrl, selectedEvaluation } from "../lib.js";
import { Icon, TierBadge } from "./common.jsx";
import { EvaluationBody, EvaluationSelectors } from "./Evaluation.jsx";

// state: { open, id, evaluationId }. The last clinic stays rendered while the drawer slides closed.
export default function Drawer({ state, onOpen, onClose }) {
  const closeRef = useRef(null);
  const c = CLINICS.find((x) => x.id === state.id);
  const evaluation = c && selectedEvaluation(c, state.evaluationId);

  useEffect(() => {
    if (state.open) closeRef.current?.focus();
  }, [state]);

  return (
    <>
      <div className="drawer-backdrop" hidden={!state.open} onClick={onClose} />
      <aside className={`drawer ${state.open ? "open" : ""}`} aria-hidden={!state.open}>
        {c && (
          <>
            <header className="drawer-head">
              <div>
                <div className="cl-dept">{c.dept} · เข้าร่วมปีงบ {c.joinFy}</div>
                <h2>{c.name}</h2>
                <div className="drawer-tags"><TierBadge tier={evaluation.tier} /></div>
              </div>
              <button ref={closeRef} className="icon-btn" aria-label="ปิด" onClick={onClose}><Icon.close /></button>
            </header>
            <div className="drawer-body">
              <EvaluationSelectors clinic={c} evaluation={evaluation} showClinic={false} onSelect={onOpen} />
              <a className="clinic-page-link" href={clinicPageUrl(c.id, evaluation.id)}>ดูหน้ารายละเอียดศูนย์ →</a>
              <EvaluationBody clinic={c} evaluation={evaluation} />
            </div>
          </>
        )}
      </aside>
    </>
  );
}

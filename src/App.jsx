/* COE Monitor – dashboard prototype. React, bundled with Vite. */
import { useEffect, useState } from "react";
import { FISCAL_YEARS, CLINICS, IS_DEMO, AS_OF } from "./dataset.js";
import { inScope } from "./lib.js";
import Drawer from "./components/Drawer.jsx";
import Overview from "./views/Overview.jsx";
import Clinics, { INITIAL_LIST_STATE } from "./views/Clinics.jsx";
import ClinicPage from "./views/ClinicPage.jsx";
import logo from "./logo.svg";

const ROUTES = {
  overview: { title: "ภาพรวมโครงการ" },
  clinics: { title: "ศูนย์ทั้งหมด" },
};

function useHash() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const onChange = () => setHash(location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  const [fy, setFy] = useState(FISCAL_YEARS[FISCAL_YEARS.length - 1]);
  const [drawer, setDrawer] = useState({ open: false, id: null, evaluationId: undefined });
  // View state survives navigation between pages, as in the original prototype.
  const [listState, setListState] = useState(INITIAL_LIST_STATE);
  const [hmClinic, setHmClinic] = useState("all");

  // Routes: #overview, #clinics, #<view>/<clinicId> (opens the drawer), #clinic/<id>/<evaluationId>[/works]
  const [key, clinicId, evaluationId, tab] = (hash || "#overview").slice(1).split("/");
  const isClinicPage = key === "clinic";
  const routeKey = ROUTES[key] ? key : "overview";
  const pageClinic = isClinicPage ? CLINICS.find((c) => c.id === +clinicId) : null;

  const openDrawer = (id, evalId) => {
    if (CLINICS.some((c) => c.id === id)) setDrawer({ open: true, id, evaluationId: evalId });
  };
  const closeDrawer = () => setDrawer((d) => (d.open ? { ...d, open: false } : d));

  // Every navigation or FY change closes the drawer and scrolls to the top;
  // a #<view>/<clinicId> link then re-opens the drawer for that clinic.
  useEffect(() => {
    window.scrollTo(0, 0);
    const deepLinkId = !isClinicPage && clinicId && CLINICS.some((c) => c.id === +clinicId) ? +clinicId : null;
    setDrawer((d) => (deepLinkId ? { open: true, id: deepLinkId, evaluationId: undefined } : { ...d, open: false }));
  }, [hash, fy, isClinicPage, clinicId]);

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === "Escape") closeDrawer(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const changeFy = (next) => {
    setFy(next);
    if (hmClinic !== "all" && !inScope(next).some((c) => c.id === +hmClinic)) setHmClinic("all");
  };

  const navClass = (route) => `nav-item ${(isClinicPage ? "clinics" : routeKey) === route ? "active" : ""}`;

  let crumbs;
  if (isClinicPage) {
    crumbs = pageClinic
      ? <>COE Monitor <span>/</span> ศูนย์ทั้งหมด <span>/</span> <b>{pageClinic.name}</b></>
      : "COE Monitor / ศูนย์ทั้งหมด";
  } else {
    crumbs = <>COE Monitor <span>/</span> <b>{ROUTES[routeKey].title}</b></>;
  }

  let view;
  if (isClinicPage) {
    view = <ClinicPage key={clinicId} clinic={pageClinic} evaluationId={evaluationId} tab={tab} />;
  } else if (routeKey === "clinics") {
    view = <Clinics fy={fy} listState={listState} onListState={setListState} onOpenClinic={openDrawer} />;
  } else {
    view = <Overview fy={fy} hmClinic={hmClinic} onHmClinic={setHmClinic} onOpenClinic={openDrawer} />;
  }

  return (
    <>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <img src={logo} alt="ศูนย์การแพทย์กาญจนาภิเษก" className="brand-logo" />
            <div className="brand-title">COE Monitor</div>
          </div>
          <nav className="nav">
            <a href="#overview" className={navClass("overview")}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z" /></svg>
              ภาพรวมโครงการ
            </a>
            <a href="#clinics" className={navClass("clinics")}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v2H4zM4 11h16v2H4zM4 17h16v2H4z" /></svg>
              คลินิกทั้งหมด
            </a>
          </nav>
        </aside>

        <div className="main">
          <header className="topbar">
            <div className="crumbs">
              {crumbs}
              {IS_DEMO && <span className="pill warning" title="ข้อมูลตัวอย่างสำหรับสาธิต ไม่ใช่ผลการประเมินจริง">ข้อมูลจำลอง · ณ {AS_OF.label}</span>}
            </div>
            <label className="fy" hidden={isClinicPage}>
              ปีงบประมาณ
              <select value={fy} onChange={(e) => changeFy(+e.target.value)}>
                {FISCAL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
          </header>
          <main className="view">{view}</main>
        </div>
      </div>

      <Drawer state={drawer} onOpen={openDrawer} onClose={closeDrawer} />
    </>
  );
}

import { TIERS, CRITERIA, STATUS } from "../data.js";

export function TierBadge({ tier, size = "" }) {
  const T = TIERS[tier];
  return <span className={`tier-badge t${tier} ${size}`} title={T.name}>{T.code}</span>;
}

export function Pill({ tone, children }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export const Icon = {
  check: () => <svg viewBox="0 0 16 16"><path d="M6.4 11.6L2.8 8l1.1-1.1 2.5 2.5 5.7-5.7 1.1 1.1z" /></svg>,
  x: () => <svg viewBox="0 0 16 16"><path d="M4.2 3.1L8 6.9l3.8-3.8 1.1 1.1L9.1 8l3.8 3.8-1.1 1.1L8 9.1l-3.8 3.8-1.1-1.1L6.9 8 3.1 4.2z" /></svg>,
  close: () => <svg viewBox="0 0 24 24"><path d="M6.4 5L12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4L12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z" /></svg>,
  clock: () => <svg viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 110 13 6.5 6.5 0 010-13zm0 1.3a5.2 5.2 0 100 10.4A5.2 5.2 0 008 2.8zM7.4 4.5h1.2v3.2l2.3 1.4-.6 1-2.9-1.7z" /></svg>,
};

export function SegBar({ clinic }) {
  return (
    <span className="segbar">
      {CRITERIA.map((k) => {
        const st = clinic.criteria[k.key][0];
        return <span key={k.key} className={`s-${st}`} title={`${k.label}: ${STATUS[st].label}`} />;
      })}
    </span>
  );
}

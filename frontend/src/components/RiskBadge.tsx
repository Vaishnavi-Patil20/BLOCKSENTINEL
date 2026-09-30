import type { Transaction } from "../types";

const config = {
  CRITICAL: "bg-sentinel-critical/15 text-sentinel-critical border-sentinel-critical/30",
  HIGH: "bg-sentinel-high/15 text-sentinel-high border-sentinel-high/30",
  MEDIUM: "bg-sentinel-medium/15 text-sentinel-medium border-sentinel-medium/30",
  LOW: "bg-sentinel-low/15 text-sentinel-low border-sentinel-low/30",
};

export const RiskBadge: React.FC<{ level?: Transaction["risk_level"]; score?: number }> = ({ level, score }) => {
  if (!level) return <span className="text-slate-500 text-xs">—</span>;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${config[level]}`}>
      {score !== undefined && <span className="mr-1.5 font-mono">{score}</span>}
      {level}
    </span>
  );
};

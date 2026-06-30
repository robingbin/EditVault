import React from "react";
import { cn } from "../lib/utils";

const variants = {
  inProgress: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  done: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  notStarted: "bg-[#1a2526] text-[#8aa0a1] border-[#243334]",
  posted: "bg-teal-500/10 text-teal-300 border-teal-500/30",
  approved: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  correction: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  rejected: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  pending: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  paid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
};

const map = {
  "In Progress": "inProgress",
  "Done": "done",
  "Not Started": "notStarted",
  "Posted": "posted",
  "Approved": "approved",
  "Correction": "correction",
  "Rejected": "rejected",
  "Pending": "pending",
  "Paid": "paid",
};

export default function StatusBadge({ status, withDot = false, className = "" }) {
  if (!status) return <span className="text-[#3f5152]">—</span>;
  const key = map[status] || "notStarted";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium",
        variants[key],
        className
      )}
    >
      {withDot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {status}
    </span>
  );
}

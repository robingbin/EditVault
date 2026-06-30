import React from "react";
import { cn } from "../lib/utils";

// Unified status palette
const variants = {
  Pending: "bg-[#1a2526] text-[#8aa0a1] border-[#243334]",
  Editing: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  "Internal Review": "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
  "Editing Completed": "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  "Sent To Client": "bg-violet-500/10 text-violet-300 border-violet-500/30",
  "Client Review": "bg-blue-500/10 text-blue-300 border-blue-500/30",
  "Correction Requested": "bg-orange-500/10 text-orange-300 border-orange-500/30",
  "Re-Editing": "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
  "Client Approved": "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  Posted: "bg-teal-500/10 text-teal-300 border-teal-500/30",
  Archived: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  // payment
  Paid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  // priorities
  Low: "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",
  Medium: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  High: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  Urgent: "bg-rose-500/10 text-rose-300 border-rose-500/30",
};

export default function StatusBadge({ status, withDot = false, className = "" }) {
  if (!status) return <span className="text-[#3f5152]">—</span>;
  const cls = variants[status] || "bg-[#1a2526] text-[#8aa0a1] border-[#243334]";
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium", cls, className)}>
      {withDot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {status}
    </span>
  );
}

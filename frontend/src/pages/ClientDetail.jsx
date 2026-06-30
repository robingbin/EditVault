import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Wallet, Calendar, FileText, CheckCircle2, Plus, Pencil, Trash2 } from "lucide-react";
import { getClientById, clientVideos } from "../mock";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import { toast } from "sonner";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ClientDetail() {
  const { id } = useParams();
  const client = getClientById(id);
  const [year] = useState(2026);
  const [activeMonth, setActiveMonth] = useState(5); // June (0-indexed)
  const [paid, setPaid] = useState(false);

  const monthKey = `${year}-${String(activeMonth + 1).padStart(2, "0")}`;
  const videos = useMemo(() => {
    const data = clientVideos[id];
    if (!data) return [];
    return data.months[monthKey] || [];
  }, [id, monthKey]);

  const totalDuration = useMemo(() => {
    const totalSeconds = videos.reduce((acc, v) => {
      const [m, s] = v.duration.split(":").map(Number);
      return acc + m * 60 + s;
    }, 0);
    const mm = Math.floor(totalSeconds / 60);
    const ss = totalSeconds % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }, [videos]);

  const billable = videos.filter((v) => v.clientStatus === "Posted" || v.clientStatus === "Approved").length;
  const totalAmount = videos.filter((v) => v.clientStatus === "Posted" || v.clientStatus === "Approved").reduce((a, v) => a + v.amount, 0);

  if (!client) {
    return (
      <div className="py-10">
        <Link to="/clients" className="text-[#2dd4bf] inline-flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> All Clients</Link>
        <p className="mt-6 text-[#7c8d8e]">Client not found.</p>
      </div>
    );
  }

  const availableMonths = [4, 5]; // May, June 2026

  return (
    <div className="space-y-7">
      <Link to="/clients" className="inline-flex items-center gap-1.5 text-[13px] text-[#8aa0a1] hover:text-[#2dd4bf] transition-colors">
        <ArrowLeft className="w-4 h-4" /> All Clients
      </Link>

      {/* Client Header card */}
      <div className="rounded-2xl border border-[#142021] bg-[#0d1516] px-6 py-5">
        <div className="flex items-start justify-between gap-5 flex-wrap">
          <div className="flex items-center gap-5">
            <Avatar name={client.name} size={56} className="text-xl" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-[#8aa0a1] mt-1.5">
                <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /><span className="font-mono-num">{client.phone}</span></span>
                <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{client.email}</span>
                <span className="inline-flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-teal-400" /><span className="text-teal-300 font-medium font-mono-num">₹{client.monthlyFee.toLocaleString()}/month</span></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-[#d6e7e6] hover:bg-[#152223] text-sm transition-colors">
              <Calendar className="w-4 h-4" /> Calendar
            </button>
            <button onClick={() => toast.success("Invoice generated for " + client.name)} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-[#d6e7e6] hover:bg-[#152223] text-sm transition-colors">
              <FileText className="w-4 h-4" /> Generate Invoice
            </button>
            <button
              onClick={() => { setPaid(true); toast.success("Month marked as paid"); }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] text-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {paid ? "Paid" : "Mark Month as Paid"}
            </button>
          </div>
        </div>
      </div>

      {/* Year + Months */}
      <div className="space-y-3">
        <button className="px-3 py-1 rounded-md border border-[#1f5450] bg-[#0e2624] text-[#2dd4bf] text-sm font-mono-num">{year}</button>
        <div className="flex gap-2 flex-wrap">
          {MONTHS.map((m, idx) => {
            const available = availableMonths.includes(idx);
            const isActive = idx === activeMonth;
            return (
              <button
                key={m}
                disabled={!available}
                onClick={() => setActiveMonth(idx)}
                className={`px-3.5 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-[#0e2624] text-[#2dd4bf] border border-[#1f5450]"
                    : available
                    ? "text-[#8aa0a1] hover:text-[#e6f7f6] hover:bg-[#0f1819] border border-transparent"
                    : "text-[#2a3637] border border-transparent cursor-not-allowed"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Video button */}
      <div>
        <button
          onClick={() => toast("Add video coming soon")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Video
        </button>
      </div>

      {/* Videos table */}
      <div className="rounded-xl border border-[#142021] bg-[#0c1314] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[12px] text-[#7c8d8e] border-b border-[#142021]">
              <th className="px-5 py-3 font-normal w-10">Sl.</th>
              <th className="px-5 py-3 font-normal">Video Name</th>
              <th className="px-5 py-3 font-normal">Duration</th>
              <th className="px-5 py-3 font-normal">Type</th>
              <th className="px-5 py-3 font-normal">Version</th>
              <th className="px-5 py-3 font-normal">Editor Status</th>
              <th className="px-5 py-3 font-normal">Client Status</th>
              <th className="px-5 py-3 font-normal">Date</th>
              <th className="px-5 py-3 font-normal">Amount</th>
              <th className="px-5 py-3 font-normal w-20"></th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr><td colSpan={10} className="px-5 py-10 text-center text-[#7c8d8e]">No videos for this month.</td></tr>
            ) : (
              videos.map((v) => (
                <tr key={v.id} className="border-b border-[#101a1b] last:border-b-0 hover:bg-[#0f1819] transition-colors">
                  <td className="px-5 py-3.5 text-[#7c8d8e] font-mono-num">{v.sl}</td>
                  <td className="px-5 py-3.5 text-[#e6f7f6] font-medium">{v.name}</td>
                  <td className="px-5 py-3.5 font-mono-num text-[#d6e7e6]">{v.duration}</td>
                  <td className="px-5 py-3.5 text-[#9bb0b1]">{v.type}</td>
                  <td className="px-5 py-3.5 text-[#9bb0b1] font-mono-num">{v.version}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={v.editorStatus} withDot /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={v.clientStatus} /></td>
                  <td className="px-5 py-3.5 text-[#9bb0b1] font-mono-num">{v.date || "—"}</td>
                  <td className="px-5 py-3.5 font-mono-num text-[#d6e7e6]">₹{v.amount.toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button className="w-7 h-7 rounded-md flex items-center justify-center text-[#7c8d8e] hover:text-[#2dd4bf] hover:bg-[#0e2624] transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button className="w-7 h-7 rounded-md flex items-center justify-center text-[#7c8d8e] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4 text-center">
          <div className="text-[12px] text-[#7c8d8e] mb-1">Total Videos</div>
          <div className="text-2xl font-bold font-mono-num text-[#e6f7f6]">{videos.length}</div>
        </div>
        <div className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4 text-center">
          <div className="text-[12px] text-[#7c8d8e] mb-1">Total Duration</div>
          <div className="text-2xl font-bold font-mono-num text-cyan-300">{totalDuration}</div>
        </div>
        <div className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4 text-center">
          <div className="text-[12px] text-[#7c8d8e] mb-1">Billable Videos</div>
          <div className="text-2xl font-bold font-mono-num text-[#e6f7f6]">{billable}</div>
        </div>
        <div className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4 text-center">
          <div className="text-[12px] text-[#7c8d8e] mb-1">Total Amount</div>
          <div className="text-2xl font-bold font-mono-num text-teal-300">₹{totalAmount.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

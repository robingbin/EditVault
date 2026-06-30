import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Monitor, Users, ArrowRight } from "lucide-react";
import { dashboardStats, pendingVideos, monthlyPayments } from "../mock";
import StatusBadge from "../components/StatusBadge";

function StatCard({ label, value, color = "text-[#e6f7f6]" }) {
  return (
    <div className="flex-1 min-w-[160px] rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4">
      <div className="text-[12px] text-[#7c8d8e] mb-1.5">{label}</div>
      <div className={`text-3xl font-bold font-mono-num ${color}`}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-[#7c8d8e] mt-1 text-sm">Overview of your video editing workflow</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/portal")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#3b3a6b] bg-[#15152a] text-[#a8a5ff] hover:bg-[#1c1c38] transition-colors text-sm font-medium"
          >
            <Monitor className="w-4 h-4" />
            Client Portal
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/clients")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-[#e6f7f6] hover:bg-[#152223] transition-colors text-sm font-medium"
          >
            <Users className="w-4 h-4" />
            View Clients
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 flex-wrap">
        <StatCard label="Pending Work" value={dashboardStats.pendingWork} color="text-amber-400" />
        <StatCard label="Awaiting Client" value={dashboardStats.awaitingClient} color="text-orange-400" />
        <StatCard label="Active Clients" value={dashboardStats.activeClients} color="text-teal-300" />
        <StatCard label="This Month Billing" value={`₹${dashboardStats.thisMonthBilling.toLocaleString()}`} color="text-cyan-400" />
        <StatCard label="Pending Payment" value={`₹${dashboardStats.pendingPayment.toLocaleString()}`} color="text-rose-400" />
      </div>

      {/* Pending Videos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Pending Videos</h2>
          <span className="text-[12px] text-[#7c8d8e] bg-[#0f1819] border border-[#1a2526] px-2.5 py-1 rounded-full">
            {pendingVideos.length} videos
          </span>
        </div>
        <div className="rounded-xl border border-[#142021] bg-[#0c1314] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[12px] text-[#7c8d8e] border-b border-[#142021]">
                <th className="px-5 py-3 font-normal">Client</th>
                <th className="px-5 py-3 font-normal">Video</th>
                <th className="px-5 py-3 font-normal">Due Date</th>
                <th className="px-5 py-3 font-normal">Editor Status</th>
                <th className="px-5 py-3 font-normal">Client Status</th>
                <th className="px-5 py-3 font-normal">Duration</th>
                <th className="px-5 py-3 font-normal">Type</th>
              </tr>
            </thead>
            <tbody>
              {pendingVideos.map((v) => (
                <tr key={v.id} className="border-b border-[#101a1b] last:border-b-0 hover:bg-[#0f1819] transition-colors">
                  <td className="px-5 py-3.5">
                    <Link to={`/clients/${v.clientId}`} className="text-[#2dd4bf] hover:underline">
                      {v.clientName}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-[#d6e7e6]">{v.video}</td>
                  <td className="px-5 py-3.5 text-[#9bb0b1]">{v.dueDate}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={v.editorStatus} withDot /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={v.clientStatus} /></td>
                  <td className="px-5 py-3.5 font-mono-num text-[#d6e7e6]">{v.duration}</td>
                  <td className="px-5 py-3.5 text-[#9bb0b1]">{v.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Monthly Payments */}
      <section>
        <h2 className="text-xl font-bold mb-4">Monthly Payments — June 2026</h2>
        <div className="rounded-xl border border-[#142021] bg-[#0c1314] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[12px] text-[#7c8d8e] border-b border-[#142021]">
                <th className="px-5 py-3 font-normal">Client</th>
                <th className="px-5 py-3 font-normal">Month</th>
                <th className="px-5 py-3 font-normal">Total Amount</th>
                <th className="px-5 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {monthlyPayments.map((p) => (
                <tr key={p.id} className="border-b border-[#101a1b] last:border-b-0 hover:bg-[#0f1819] transition-colors">
                  <td className="px-5 py-3.5">
                    <Link to={`/clients/${p.clientId}`} className="text-[#2dd4bf] hover:underline">
                      {p.clientName}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-[#9bb0b1]">{p.month}</td>
                  <td className="px-5 py-3.5 font-mono-num text-[#d6e7e6]">₹{p.totalAmount.toLocaleString()}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={p.status} withDot /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4 text-center">
            <div className="text-[12px] text-[#7c8d8e] mb-1">Total Billing</div>
            <div className="text-2xl font-bold font-mono-num text-[#e6f7f6]">₹8,200</div>
          </div>
          <div className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4 text-center">
            <div className="text-[12px] text-[#7c8d8e] mb-1">Received</div>
            <div className="text-2xl font-bold font-mono-num text-emerald-400">₹0</div>
          </div>
          <div className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4 text-center">
            <div className="text-[12px] text-[#7c8d8e] mb-1">Pending</div>
            <div className="text-2xl font-bold font-mono-num text-rose-400">₹8,200</div>
          </div>
        </div>
      </section>
    </div>
  );
}

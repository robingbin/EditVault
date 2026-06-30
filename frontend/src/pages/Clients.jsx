import React from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, Wallet, ChevronRight } from "lucide-react";
import { clients } from "../mock";
import Avatar from "../components/Avatar";

export default function Clients() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Clients</h1>
        <p className="text-[#7c8d8e] mt-1 text-sm">{clients.length} total clients</p>
      </div>

      <div className="space-y-3">
        {clients.map((c) => (
          <Link
            key={c.id}
            to={`/clients/${c.id}`}
            className="card-row block rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4 hover:border-[#1f5450]"
          >
            <div className="flex items-center gap-4">
              <Avatar name={c.name} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#e6f7f6] text-[15px] mb-1.5">{c.name}</div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-[#8aa0a1]">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="font-mono-num">{c.phone}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {c.email}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-teal-300 font-medium font-mono-num">₹{c.monthlyFee.toLocaleString()}/month</span>
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#3f5152]" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

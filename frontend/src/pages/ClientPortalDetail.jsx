import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Play, Loader2 } from "lucide-react";
import { fetchClient, fetchClientVideos, ADMIN_STATUSES, setVideoStatus, fetchCorrections } from "../lib/api";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";

export default function ClientPortalDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [videos, setVideos] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [c, vs, cors] = await Promise.all([fetchClient(id), fetchClientVideos(id), fetchCorrections({ clientId: id })]);
      setClient(c); setVideos(vs); setCorrections(cors);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const onStatus = async (v, status) => {
    try { await setVideoStatus(v.id, status); toast.success(`Status → ${status}`); load(); } catch (e) { toast.error(e.message); }
  };

  if (loading && !client) return <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 text-[#2dd4bf] animate-spin" /></div>;
  if (!client) return <div className="py-10"><Link to="/admin/portal" className="text-[#2dd4bf] inline-flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> Back</Link></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-7">
      <Link to="/admin/portal" className="inline-flex items-center gap-1.5 text-[13px] text-[#8aa0a1] hover:text-[#2dd4bf]"><ArrowLeft className="w-4 h-4" /> All Clients</Link>

      <div className="rounded-2xl border border-[#142021] bg-[#0d1516] px-6 py-5">
        <div className="flex items-center gap-5">
          <Avatar name={client.name} size={56} className="text-xl" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-[#8aa0a1] mt-1.5">
              {client.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /><span className="font-mono-num">{client.phone}</span></span>}
              <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{client.email}</span>
            </div>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-3">All videos</h2>
        {videos.length === 0 ? <div className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-10 text-center text-[#7c8d8e]">No videos.</div> : (
          <div className="space-y-3">
            {videos.map((v) => (
              <div key={v.id} className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-12 h-12 rounded-lg bg-[#0e2624] border border-[#143a37] flex items-center justify-center shrink-0">
                    <Play className="w-5 h-5 text-[#2dd4bf]" fill="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#e6f7f6]">{v.name}</div>
                    <div className="flex items-center gap-3 mt-1 text-[12px] text-[#8aa0a1]"><span className="font-mono-num">{v.duration}</span><span>•</span><span>{v.type}</span><span>•</span><span className="font-mono-num">{v.version}</span></div>
                  </div>
                  <Select value={v.status} onValueChange={(val) => onStatus(v, val)}>
                    <SelectTrigger className="w-[180px] bg-[#0a1112] border border-[#243334] text-[#e6f7f6] h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d1516] border border-[#243334] text-[#e6f7f6]">{ADMIN_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <StatusBadge status={v.status} withDot />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {corrections.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3">Corrections</h2>
          <div className="space-y-2">
            {corrections.map((c) => (
              <div key={c.id} className="rounded-xl border border-[#142021] bg-[#0d1516] px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap"><span className="font-medium text-[#e6f7f6]">{c.title}</span><StatusBadge status={c.priority} /><span className="text-[12px] text-[#7c8d8e]">on {c.videos?.name}</span></div>
                {c.description && <div className="text-[13px] text-[#9bb0b1] mt-1">{c.description}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

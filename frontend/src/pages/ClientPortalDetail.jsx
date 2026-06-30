import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Mail, CheckCircle2, XCircle, RotateCcw, Play, Loader2 } from "lucide-react";
import { fetchClient, fetchClientVideos, updateVideo } from "../lib/api";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import { toast } from "sonner";

export default function ClientPortalDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const c = await fetchClient(id); setClient(c);
      const vs = await fetchClientVideos(id);
      setVideos(vs.filter((v) => v.editor_status === 'Done'));
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const setStatus = async (videoId, status) => {
    try {
      await updateVideo(videoId, { client_status: status });
      toast.success(`Marked as ${status}`);
      load();
    } catch (e) { toast.error(e.message); }
  };

  if (loading && !client) return <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 text-[#2dd4bf] animate-spin" /></div>;
  if (!client) return <div className="py-10"><Link to="/admin/portal" className="text-[#2dd4bf] inline-flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> Back</Link><p className="mt-6 text-[#7c8d8e]">Client not found.</p></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-7">
      <Link to="/admin/portal" className="inline-flex items-center gap-1.5 text-[13px] text-[#8aa0a1] hover:text-[#2dd4bf] transition-colors"><ArrowLeft className="w-4 h-4" /> All Clients</Link>

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

      <div>
        <h2 className="text-lg font-bold mb-3">Videos for review</h2>
        {videos.length === 0 ? (
          <div className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-10 text-center text-[#7c8d8e]">No videos pending review.</div>
        ) : (
          <div className="space-y-3">
            {videos.map((v) => (
              <div key={v.id} className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-12 h-12 rounded-lg bg-[#0e2624] border border-[#143a37] flex items-center justify-center shrink-0">
                    <Play className="w-5 h-5 text-[#2dd4bf]" fill="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#e6f7f6]">{v.name}</div>
                    <div className="flex items-center gap-3 mt-1 text-[12px] text-[#8aa0a1]">
                      <span className="font-mono-num">{v.duration}</span>
                      <span>•</span><span>{v.type}</span>
                      <span>•</span><span className="font-mono-num">{v.version}</span>
                    </div>
                  </div>
                  <StatusBadge status={v.client_status} />
                </div>
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <button onClick={() => setStatus(v.id, 'Approved')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-medium transition-colors"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button>
                  <button onClick={() => setStatus(v.id, 'Correction')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500/10 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20 text-xs font-medium transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Request Correction</button>
                  <button onClick={() => setStatus(v.id, 'Rejected')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-medium transition-colors"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                  <button onClick={() => setStatus(v.id, 'Posted')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20 text-xs font-medium transition-colors ml-auto">Mark as Posted</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

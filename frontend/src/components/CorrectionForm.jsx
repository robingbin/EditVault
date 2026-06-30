import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, Upload } from 'lucide-react';
import { createCorrection, setVideoStatus } from '../lib/api';
import { toast } from 'sonner';

export default function CorrectionForm({ open, onOpenChange, video, clientId, onSubmitted }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [shot, setShot] = useState(null);
  const [voice, setVoice] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!video) return;
    setBusy(true);
    try {
      await createCorrection({ video_id: video.id, client_id: clientId, title, description, priority }, shot, voice);
      await setVideoStatus(video.id, 'Correction Requested');
      toast.success('Correction requested');
      onSubmitted();
      onOpenChange(false);
      setTitle(''); setDescription(''); setPriority('Medium'); setShot(null); setVoice(null);
    } catch (err) { toast.error(err.message || 'Failed to submit'); }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d1516] border border-[#142021] text-[#e6f7f6] max-w-lg">
        <DialogHeader><DialogTitle>Request Correction — {video?.name}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="block text-[12px] text-[#8aa0a1] mb-1.5">Correction Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Audio sync off at 0:12"
              className="w-full px-3 py-2 rounded-lg bg-[#0a1112] border border-[#243334] text-[#e6f7f6] outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20" />
          </label>
          <label className="block">
            <span className="block text-[12px] text-[#8aa0a1] mb-1.5">Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the change needed…"
              className="w-full px-3 py-2 rounded-lg bg-[#0a1112] border border-[#243334] text-[#e6f7f6] outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20" />
          </label>
          <label className="block">
            <span className="block text-[12px] text-[#8aa0a1] mb-1.5">Priority</span>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6] h-[38px]"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0d1516] border border-[#243334] text-[#e6f7f6]">
                {['Low','Medium','High','Urgent'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[12px] text-[#8aa0a1] mb-1.5">Screenshot (optional)</span>
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#243334] bg-[#0a1112] text-[#8aa0a1] text-[12px] cursor-pointer hover:border-[#2dd4bf]">
                <Upload className="w-3.5 h-3.5" /> <span className="truncate">{shot?.name || 'Choose image…'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setShot(e.target.files?.[0] || null)} />
              </label>
            </label>
            <label className="block">
              <span className="block text-[12px] text-[#8aa0a1] mb-1.5">Voice Note (optional)</span>
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#243334] bg-[#0a1112] text-[#8aa0a1] text-[12px] cursor-pointer hover:border-[#2dd4bf]">
                <Upload className="w-3.5 h-3.5" /> <span className="truncate">{voice?.name || 'Choose audio…'}</span>
                <input type="file" accept="audio/*" className="hidden" onChange={(e) => setVoice(e.target.files?.[0] || null)} />
              </label>
            </label>
          </div>
          <p className="text-[11px] text-[#7c8d8e]">Files upload to Supabase Storage bucket <code className="font-mono">corrections</code>. If you didn’t create the bucket, attachments will be skipped silently.</p>
          <DialogFooter className="pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-[#d6e7e6] hover:bg-[#152223] text-sm">Cancel</button>
            <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] disabled:opacity-60 text-sm inline-flex items-center gap-2">{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Submit Correction</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useRef } from 'react';
import api from '../api';
import { useAppStore } from '../store/appStore';

interface Props { onClose: () => void; }

export default function CreateServerModal({ onClose }: Props) {
  const addServer = useAppStore(s => s.addServer);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [inviteCode, setInviteCode] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name', name);
      if (fileRef.current?.files?.[0]) fd.append('icon', fileRef.current.files[0]);
      const { data } = await api.post('/servers', fd);
      addServer(data);
      onClose();
    } catch (err: any) { setError(err.response?.data?.error || 'Hata'); }
    finally { setLoading(false); }
  };

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.post(`/servers/join/${inviteCode.trim().toUpperCase()}`);
      addServer(data);
      onClose();
    } catch (err: any) { setError(err.response?.data?.error || 'Davet kodu geçersiz'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#2b2d31] rounded-lg w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-white font-bold text-xl mb-1">Sunucu Oluştur veya Katıl</h2>
        <p className="text-[#949ba4] text-sm mb-5">Topluluğunu büyüt</p>

        <div className="flex gap-2 mb-5">
          {(['create', 'join'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded font-semibold text-sm transition-colors ${tab === t ? 'bg-[#5865f2] text-white' : 'bg-[#383a40] text-[#949ba4] hover:text-white'}`}>
              {t === 'create' ? 'Sunucu Oluştur' : 'Sunucuya Katıl'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <form onSubmit={create} className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative cursor-pointer w-16 h-16 shrink-0" onClick={() => fileRef.current?.click()}>
                <div className="w-16 h-16 rounded-full bg-[#383a40] border-2 border-dashed border-[#4e5058] flex items-center justify-center text-[#949ba4] hover:border-[#5865f2] transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" />
              </div>
              <div className="flex-1">
                <label className="text-[#b5bac1] text-xs font-semibold uppercase tracking-wide block mb-1.5">Sunucu Adı</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  className="w-full bg-[#1e1f22] text-white rounded px-3 py-2.5 outline-none border border-[#3a3c42] focus:border-[#5865f2] text-sm placeholder-[#6d6f78]"
                  placeholder="Harika Sunucu" />
              </div>
            </div>
            {error && <p className="text-[#ed4245] text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 bg-[#383a40] hover:bg-[#404249] text-white rounded py-2 text-sm font-semibold transition-colors">İptal</button>
              <button type="submit" disabled={loading} className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-60 text-white rounded py-2 text-sm font-semibold transition-colors">
                {loading ? 'Oluşturuluyor...' : 'Oluştur'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={join} className="flex flex-col gap-4">
            <div>
              <label className="text-[#b5bac1] text-xs font-semibold uppercase tracking-wide block mb-1.5">Davet Kodu</label>
              <input value={inviteCode} onChange={e => setInviteCode(e.target.value)} required
                className="w-full bg-[#1e1f22] text-white rounded px-3 py-2.5 outline-none border border-[#3a3c42] focus:border-[#5865f2] text-sm placeholder-[#6d6f78]"
                placeholder="ABC12345" />
            </div>
            {error && <p className="text-[#ed4245] text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 bg-[#383a40] hover:bg-[#404249] text-white rounded py-2 text-sm font-semibold transition-colors">İptal</button>
              <button type="submit" disabled={loading} className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-60 text-white rounded py-2 text-sm font-semibold transition-colors">
                {loading ? 'Katılıyor...' : 'Katıl'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

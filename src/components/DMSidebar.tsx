import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import type { DM } from '../store/appStore';
import api from '../api';
import UserSettingsModal from './UserSettingsModal';

interface Props {
  onDMSelect: (dm: DM, user: { id: string; username: string; avatar: string | null; status: string }) => void;
}

export default function DMSidebar({ onDMSelect }: Props) {
  const user = useAuthStore(s => s.user);
  const { dms, setDMs, activeDMId, memberStatuses } = useAppStore();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<{ id: string; username: string; avatar: string | null; status: string }[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    api.get('/dms').then(r => setDMs(r.data));
  }, []);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await api.get(`/users/search?q=${search}`);
      setResults(data);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const openDM = async (targetUser: { id: string; username: string; avatar: string | null; status: string }) => {
    const { data } = await api.post(`/dms/${targetUser.id}`);
    const dm: DM = { id: data.id, user_id: targetUser.id, username: targetUser.username, avatar: targetUser.avatar, status: targetUser.status };
    setDMs([dm, ...dms.filter(d => d.id !== dm.id)]);
    onDMSelect(dm, targetUser);
    setSearch(''); setResults([]);
  };

  return (
    <div className="w-60 bg-[#2b2d31] flex flex-col h-full shrink-0">
      <div className="p-3 border-b border-[#1e1f22]">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-white shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          <span className="text-white font-bold">Echo<span className="text-[#5865f2]">Cord</span></span>
        </div>
        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kullanıcı ara..."
            className="w-full bg-[#1e1f22] text-white text-sm rounded px-3 py-1.5 outline-none placeholder-[#949ba4]" />
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-[#1e1f22] rounded-b-lg shadow-xl z-50 border border-[#3a3c42] border-t-0">
              {results.map(r => (
                <button key={r.id} onClick={() => openDM(r)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#35373c] transition-colors">
                  {r.avatar
                    ? <img src={`http://localhost:3001${r.avatar}`} className="w-7 h-7 rounded-full object-cover" />
                    : <div className="w-7 h-7 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-bold">{r.username[0]}</div>}
                  <span className="text-white text-sm">{r.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 py-1 text-[11px] font-semibold text-[#949ba4] uppercase tracking-wide">Direkt Mesajlar</div>
        {dms.map(dm => {
          const status = memberStatuses[dm.user_id] || dm.status;
          return (
            <button key={dm.id} onClick={() => openDM({ id: dm.user_id, username: dm.username, avatar: dm.avatar, status: dm.status })}
              className={`w-full flex items-center gap-2 px-2 py-2 mx-1 rounded transition-colors ${activeDMId === dm.id ? 'bg-[#404249]' : 'hover:bg-[#35373c]'}`}
              style={{ width: 'calc(100% - 8px)' }}>
              <div className="relative shrink-0">
                {dm.avatar
                  ? <img src={`http://localhost:3001${dm.avatar}`} className="w-8 h-8 rounded-full object-cover" />
                  : <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-sm font-bold">{dm.username[0]}</div>}
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${status === 'online' ? 'bg-[#23a55a]' : 'bg-[#80848e]'}`} />
              </div>
              <span className={`text-sm font-medium truncate ${activeDMId === dm.id ? 'text-white' : 'text-[#949ba4]'}`}>{dm.username}</span>
            </button>
          );
        })}
      </div>

      <div className="h-[52px] bg-[#232428] px-2 flex items-center gap-2 shrink-0">
        <div className="relative cursor-pointer" onClick={() => setShowSettings(true)}>
          {user?.avatar
            ? <img src={`http://localhost:3001${user.avatar}`} className="w-8 h-8 rounded-full object-cover" />
            : <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-xs font-bold text-white">{user?.username[0]}</div>}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#232428] bg-[#23a55a]" />
        </div>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowSettings(true)}>
          <div className="text-[13px] font-semibold text-white truncate">{user?.username}</div>
          <div className="text-[11px] text-[#b5bac1]">Çevrimiçi</div>
        </div>
        <button onClick={() => setShowSettings(true)} className="w-8 h-8 rounded flex items-center justify-center text-[#b5bac1] hover:bg-[#35373c] hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </div>
      {showSettings && <UserSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

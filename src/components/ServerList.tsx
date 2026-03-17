import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import type { EchoServer } from '../store/appStore';
import UserSettingsModal from './UserSettingsModal';
import CreateServerModal from './CreateServerModal';

interface Props {
  onDMOpen: () => void;
}

export default function ServerList({ onDMOpen }: Props) {
  const user = useAuthStore(s => s.user);
  const { servers, activeServerId, setActiveServer, activeDMId } = useAppStore();
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const isDMActive = !activeServerId && activeDMId !== null;

  return (
    <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-2 shrink-0 overflow-y-auto">
      <button
        onClick={onDMOpen}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg transition-all hover:rounded-xl ${isDMActive ? 'bg-[#5865f2] rounded-xl' : 'bg-[#313338] hover:bg-[#5865f2]'}`}
        title="Direkt Mesajlar">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
        </svg>
      </button>

      <div className="w-8 h-[2px] bg-[#2c2d31] rounded-full" />

      {servers.map((sv: EchoServer) => (
        <button
          key={sv.id}
          onClick={() => setActiveServer(sv.id)}
          title={sv.name}
          className={`w-12 h-12 transition-all hover:rounded-xl relative group ${activeServerId === sv.id ? 'rounded-xl' : 'rounded-full'}`}>
          {activeServerId === sv.id && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full -ml-1" />
          )}
          {sv.icon
            ? <img src={`http://localhost:3001${sv.icon}`} className="w-12 h-12 rounded-[inherit] object-cover" />
            : <div className={`w-12 h-12 flex items-center justify-center text-white text-sm font-bold transition-all ${activeServerId === sv.id ? 'bg-[#5865f2] rounded-xl' : 'bg-[#313338] rounded-full hover:bg-[#5865f2]'}`}>
                {sv.name.slice(0, 2).toUpperCase()}
              </div>}
          <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#111214] text-white text-sm font-semibold px-3 py-1.5 rounded pointer-events-none opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 shadow-xl">
            {sv.name}
          </div>
        </button>
      ))}

      <button
        onClick={() => setShowCreateServer(true)}
        className="w-12 h-12 rounded-full bg-[#313338] hover:bg-[#23a55a] hover:rounded-xl flex items-center justify-center text-[#23a55a] hover:text-white transition-all"
        title="Sunucu Ekle">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <div className="flex-1" />

      <button onClick={() => setShowSettings(true)} className="relative w-12 h-12 rounded-full overflow-hidden hover:rounded-xl transition-all" title="Profil">
        {user?.avatar
          ? <img src={`http://localhost:3001${user.avatar}`} className="w-12 h-12 object-cover" />
          : <div className="w-12 h-12 bg-[#5865f2] flex items-center justify-center text-white font-bold">{user?.username[0]}</div>}
      </button>

      {showCreateServer && <CreateServerModal onClose={() => setShowCreateServer(false)} />}
      {showSettings && <UserSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

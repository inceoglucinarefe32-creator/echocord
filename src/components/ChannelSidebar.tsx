import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import type { EchoServer, Channel } from '../store/appStore';
import VoiceChannel from './VoiceChannel';
import UserSettingsModal from './UserSettingsModal';
import api from '../api';

interface Props {
  server: EchoServer;
  onChannelSelect: (ch: Channel) => void;
  activeChannelId: string | null;
}

export default function ChannelSidebar({ server, onChannelSelect, activeChannelId }: Props) {
  const user = useAuthStore(s => s.user);
  const updateServer = useAppStore(s => s.updateServer);
  const removeServer = useAppStore(s => s.removeServer);
  const setActiveServer = useAppStore(s => s.setActiveServer);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChName, setNewChName] = useState('');
  const [newChType, setNewChType] = useState<'text' | 'voice'>('text');
  const [showMenu, setShowMenu] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const isOwner = server.owner_id === user?.id;
  const textChannels = server.channels.filter(c => c.type === 'text');
  const voiceChannels = server.channels.filter(c => c.type === 'voice');

  const addChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChName.trim()) return;
    const { data } = await api.post(`/servers/${server.id}/channels`, { name: newChName, type: newChType });
    updateServer({ ...server, channels: [...server.channels, data] });
    setNewChName(''); setShowAddChannel(false);
  };

  const leaveServer = async () => {
    await api.delete(`/servers/${server.id}/leave`);
    removeServer(server.id);
    setActiveServer(null);
  };

  return (
    <div className="w-60 bg-[#2b2d31] flex flex-col shrink-0 h-full">
      <div className="relative">
        <button onClick={() => setShowMenu(!showMenu)}
          className="w-full h-12 px-4 flex items-center border-b border-[#1e1f22] shadow-sm hover:bg-[#35373c] transition-colors">
          {server.icon
            ? <img src={`http://localhost:3001${server.icon}`} className="w-5 h-5 rounded-full object-cover mr-2" />
            : null}
          <span className="font-bold text-white text-[15px] truncate flex-1 text-left">{server.name}</span>
          <svg className="w-4 h-4 text-[#b5bac1] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showMenu && (
          <div className="absolute top-12 left-2 right-2 bg-[#1e1f22] rounded-lg shadow-2xl z-50 py-1 border border-[#3a3c42]">
            <button onClick={() => { setShowInvite(true); setShowMenu(false); }}
              className="w-full text-left px-3 py-2 text-[#dcddde] hover:bg-[#5865f2] hover:text-white text-sm rounded mx-0.5 transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Davet Bağlantısı
            </button>
            {isOwner && (
              <button onClick={() => { setShowAddChannel(true); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 text-[#dcddde] hover:bg-[#5865f2] hover:text-white text-sm rounded mx-0.5 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Kanal Oluştur
              </button>
            )}
            <div className="border-t border-[#3a3c42] my-1" />
            <button onClick={leaveServer}
              className="w-full text-left px-3 py-2 text-[#ed4245] hover:bg-[#ed4245] hover:text-white text-sm rounded mx-0.5 transition-colors">
              Sunucudan Ayrıl
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {textChannels.length > 0 && (
          <div className="mb-1">
            <div className="px-4 py-1 text-[11px] font-semibold text-[#949ba4] uppercase tracking-wide">Metin Kanalları</div>
            {textChannels.map(ch => (
              <button key={ch.id} onClick={() => onChannelSelect(ch)}
                className={`w-full text-left px-2 mx-2 py-[6px] rounded flex items-center gap-1.5 text-[15px] transition-colors ${activeChannelId === ch.id ? 'bg-[#404249] text-white' : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dcddde]'}`}
                style={{ width: 'calc(100% - 16px)' }}>
                <span className="text-[#949ba4]">#</span>
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </div>
        )}
        {voiceChannels.length > 0 && (
          <div>
            <div className="px-4 py-1 text-[11px] font-semibold text-[#949ba4] uppercase tracking-wide">Ses Kanalları</div>
            {voiceChannels.map(ch => (
              <VoiceChannel key={ch.id} channelId={ch.id} channelName={ch.name} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#1e1f22] p-2">
        <div className="text-[11px] font-semibold text-[#949ba4] uppercase tracking-wide mb-1 px-1">
          Üyeler ({server.members.length})
        </div>
        <div className="max-h-32 overflow-y-auto">
          {server.members.map(m => (
            <div key={m.id} className="flex items-center gap-2 px-1 py-1">
              <div className="relative shrink-0">
                {m.avatar
                  ? <img src={`http://localhost:3001${m.avatar}`} className="w-6 h-6 rounded-full object-cover" />
                  : <div className="w-6 h-6 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-[10px] font-bold">{m.username[0]}</div>}
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#2b2d31] ${m.status === 'online' ? 'bg-[#23a55a]' : 'bg-[#80848e]'}`} />
              </div>
              <span className={`text-sm truncate ${m.id === user?.id ? 'text-white' : 'text-[#949ba4]'}`}>{m.username}</span>
            </div>
          ))}
        </div>
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

      {showAddChannel && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAddChannel(false)}>
          <form className="bg-[#2b2d31] rounded-lg p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()} onSubmit={addChannel}>
            <h3 className="text-white font-bold text-lg mb-4">Kanal Oluştur</h3>
            <div className="flex gap-2 mb-3">
              {(['text', 'voice'] as const).map(t => (
                <button key={t} type="button" onClick={() => setNewChType(t)}
                  className={`flex-1 py-2 rounded text-sm font-semibold transition-colors ${newChType === t ? 'bg-[#5865f2] text-white' : 'bg-[#383a40] text-[#949ba4]'}`}>
                  {t === 'text' ? '# Metin' : '🔊 Ses'}
                </button>
              ))}
            </div>
            <input value={newChName} onChange={e => setNewChName(e.target.value)} placeholder="kanal-adı" required
              className="w-full bg-[#1e1f22] text-white rounded px-3 py-2.5 outline-none border border-[#3a3c42] focus:border-[#5865f2] text-sm mb-4" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddChannel(false)} className="flex-1 bg-[#383a40] text-white rounded py-2 text-sm font-semibold">İptal</button>
              <button type="submit" className="flex-1 bg-[#5865f2] text-white rounded py-2 text-sm font-semibold">Oluştur</button>
            </div>
          </form>
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowInvite(false)}>
          <div className="bg-[#2b2d31] rounded-lg p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-2">Davet Bağlantısı</h3>
            <p className="text-[#949ba4] text-sm mb-4">Bu kodu arkadaşlarınla paylaş</p>
            <div className="bg-[#1e1f22] rounded px-3 py-2.5 flex items-center gap-2">
              <span className="text-white font-mono text-sm flex-1">{server.invite_code}</span>
              <button onClick={() => navigator.clipboard.writeText(server.invite_code)}
                className="text-[#5865f2] hover:text-white text-xs font-semibold transition-colors">Kopyala</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

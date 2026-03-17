import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../socket';
import { useAppStore } from '../store/appStore';
import type { Message } from '../store/appStore';
import api from '../api';

interface Props {
  channelId: string;
  channelName: string;
  isDM?: boolean;
  dmUser?: { id: string; username: string; avatar: string | null; status: string } | null;
  memberCount?: number;
}

export default function ChatArea({ channelId, channelName, isDM, dmUser, memberCount }: Props) {
  const { messages, setMessages, addMessage } = useAppStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  useEffect(() => {
    if (!channelId) return;
    const roomEvent = isDM ? 'dm:join' : 'channel:join';
    const leaveEvent = isDM ? 'dm:leave' : 'channel:leave';
    const msgEvent = isDM ? 'dm:new' : 'message:new';
    const fetchUrl = isDM ? `/dms/${channelId}/messages` : `/channels/${channelId}/messages`;

    socket.emit(roomEvent, channelId);
    api.get(fetchUrl).then(r => setMessages(r.data));

    const onNew = (msg: Message) => addMessage(msg);
    socket.on(msgEvent, onNew);

    return () => {
      socket.emit(leaveEvent, channelId);
      socket.off(msgEvent, onNew);
    };
  }, [channelId, isDM]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    if (isDM) socket.emit('dm:send', { dmChannelId: channelId, content: input.trim() });
    else socket.emit('message:send', { channelId, content: input.trim() });
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Bugün ${time}` : d.toLocaleDateString('tr-TR') + ' ' + time;
  };

  const AvatarEl = ({ msg }: { msg: Message }) => {
    const url = msg.avatar ? `http://localhost:3001${msg.avatar}` : null;
    return url
      ? <img src={url} className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5" />
      : <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5">
          {msg.username[0]?.toUpperCase()}
        </div>;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#313338]">
      <div className="h-12 px-4 flex items-center gap-2 border-b border-[#1e1f22] shrink-0">
        {isDM && dmUser ? (
          <>
            {dmUser.avatar
              ? <img src={`http://localhost:3001${dmUser.avatar}`} className="w-6 h-6 rounded-full object-cover" />
              : <div className="w-6 h-6 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-bold">{dmUser.username[0]}</div>}
            <span className="font-bold text-white text-[15px]">{dmUser.username}</span>
            <div className={`w-2 h-2 rounded-full ml-1 ${dmUser.status === 'online' ? 'bg-[#23a55a]' : 'bg-[#80848e]'}`} />
          </>
        ) : (
          <>
            <span className="text-[#949ba4] text-xl">#</span>
            <span className="font-bold text-white text-[15px]">{channelName}</span>
            {memberCount !== undefined && (
              <span className="ml-auto text-[#949ba4] text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#23a55a]" />
                {memberCount} üye
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2">
        {messages.length === 0 && (
          <div className="px-4 py-8 text-center text-[#949ba4]">
            <div className="text-5xl mb-2">{isDM ? '💬' : '#'}</div>
            <h3 className="text-white font-bold text-xl mb-1">
              {isDM ? `${dmUser?.username} ile konuşma başladı` : `#${channelName} kanalına hoş geldiniz!`}
            </h3>
            <p className="text-sm">İlk mesajı siz gönderin.</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const prev = i > 0 ? messages[i - 1] : null;
          const grouped = prev?.user_id === msg.user_id && (msg.created_at - (prev?.created_at || 0)) < 300;
          return grouped ? (
            <div key={msg.id} className="pl-14 pr-4 py-[1px] hover:bg-[#2e3035] group relative">
              <span className="absolute left-4 top-1 text-[11px] text-[#4e5058] opacity-0 group-hover:opacity-100 transition-opacity">{formatTime(msg.created_at)}</span>
              <p className="text-[#dcddde] text-[15px] leading-relaxed break-words">{msg.content}</p>
            </div>
          ) : (
            <div key={msg.id} className="flex gap-3 px-4 py-1 mt-2 hover:bg-[#2e3035]">
              <AvatarEl msg={msg} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="font-semibold text-white text-[15px]">{msg.username}</span>
                  <span className="text-[11px] text-[#949ba4]">{formatTime(msg.created_at)}</span>
                </div>
                <p className="text-[#dcddde] text-[15px] leading-relaxed break-words">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-6">
        <div className="bg-[#383a40] rounded-lg flex items-end gap-2 px-4 py-2.5">
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder={isDM ? `${dmUser?.username} kullanıcısına mesaj gönder` : `#${channelName} kanalına mesaj gönder`}
            rows={1} className="flex-1 bg-transparent text-[#dcddde] placeholder-[#6d6f78] resize-none outline-none text-[15px] leading-relaxed max-h-32" />
          <button onClick={send} disabled={!input.trim()}
            className="text-[#b5bac1] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 pb-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

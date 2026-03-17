import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../socket';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';

interface Peer {
  socketId: string;
  userId: string;
  username: string;
  pc: RTCPeerConnection;
  stream?: MediaStream;
  screenStream?: MediaStream;
  audioEl?: HTMLAudioElement;
  videoEl?: HTMLVideoElement;
}

interface Props {
  channelId: string;
  channelName: string;
}

const ICE_CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function VoiceChannel({ channelId, channelName }: Props) {
  const user = useAuthStore(s => s.user);
  const setVoiceChannel = useAppStore(s => s.setVoiceChannel);
  const voiceChannelId = useAppStore(s => s.voiceChannelId);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [muted, setMuted] = useState(false);
  const [sharing, setSharing] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, Peer>>(new Map());
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const socket = getSocket();

  const inVoice = voiceChannelId === channelId;

  const createPeer = useCallback((socketId: string, userId: string, username: string): Peer => {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
    }

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      const peer = peersRef.current.get(socketId);
      if (!peer) return;
      if (e.track.kind === 'audio') {
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play().catch(() => {});
        peer.audioEl = audio;
        peer.stream = stream;
      } else if (e.track.kind === 'video') {
        peer.screenStream = stream;
        const video = document.getElementById(`screen-${socketId}`) as HTMLVideoElement;
        if (video) { video.srcObject = stream; video.play().catch(() => {}); }
      }
      setPeers(new Map(peersRef.current));
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('voice:ice', { to: socketId, candidate: e.candidate });
    };

    const peer: Peer = { socketId, userId, username, pc };
    peersRef.current.set(socketId, peer);
    setPeers(new Map(peersRef.current));
    return peer;
  }, [socket]);

  const joinVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      socket.emit('voice:join', { channelId });
      setVoiceChannel(channelId);
    } catch {
      alert('Mikrofon erişimi reddedildi');
    }
  };

  const leaveVoice = () => {
    socket.emit('voice:leave', { channelId });
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    stopScreenShare();
    peersRef.current.forEach(p => { p.pc.close(); p.audioEl?.remove(); });
    peersRef.current.clear();
    setPeers(new Map());
    setVoiceChannel(null);
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(!muted);
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = stream;
      if (screenVideoRef.current) { screenVideoRef.current.srcObject = stream; screenVideoRef.current.play(); }
      peersRef.current.forEach(p => {
        stream.getTracks().forEach(t => p.pc.addTrack(t, stream));
      });
      stream.getVideoTracks()[0].onended = stopScreenShare;
      socket.emit('voice:screen-share', { channelId, sharing: true });
      setSharing(true);
    } catch {}
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
    socket.emit('voice:screen-share', { channelId, sharing: false });
    setSharing(false);
  };

  useEffect(() => {
    if (!inVoice) return;

    socket.on('voice:peers', async (existingPeers: { socketId: string; userId: string; username: string }[]) => {
      for (const ep of existingPeers) {
        const peer = createPeer(ep.socketId, ep.userId, ep.username);
        const offer = await peer.pc.createOffer();
        await peer.pc.setLocalDescription(offer);
        socket.emit('voice:offer', { to: ep.socketId, offer, channelId });
      }
    });

    socket.on('voice:user-joined', async ({ socketId, userId, username }: { socketId: string; userId: string; username: string }) => {
      createPeer(socketId, userId, username);
    });

    socket.on('voice:offer', async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      let peer = peersRef.current.get(from);
      if (!peer) {
        const info = { socketId: from, userId: '', username: 'Kullanıcı' };
        peer = createPeer(from, info.userId, info.username);
      }
      await peer.pc.setRemoteDescription(offer);
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);
      socket.emit('voice:answer', { to: from, answer });
    });

    socket.on('voice:answer', async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      const peer = peersRef.current.get(from);
      if (peer) await peer.pc.setRemoteDescription(answer);
    });

    socket.on('voice:ice', async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const peer = peersRef.current.get(from);
      if (peer) await peer.pc.addIceCandidate(candidate);
    });

    socket.on('voice:user-left', ({ socketId }: { socketId: string }) => {
      const peer = peersRef.current.get(socketId);
      if (peer) { peer.pc.close(); peer.audioEl?.remove(); }
      peersRef.current.delete(socketId);
      setPeers(new Map(peersRef.current));
    });

    socket.on('voice:members', ({ members }: { members: { socketId: string; userId: string; username: string }[] }) => {
      setPeers(prev => {
        const next = new Map(prev);
        members.forEach(m => {
          if (!next.has(m.socketId) && m.socketId !== socket.id) {
            createPeer(m.socketId, m.userId, m.username);
          }
        });
        return next;
      });
    });

    return () => {
      socket.off('voice:peers');
      socket.off('voice:user-joined');
      socket.off('voice:offer');
      socket.off('voice:answer');
      socket.off('voice:ice');
      socket.off('voice:user-left');
      socket.off('voice:members');
    };
  }, [inVoice, channelId, createPeer, socket]);

  if (!inVoice) {
    return (
      <div className="flex items-center justify-between px-2 py-1 mx-2 rounded hover:bg-[#35373c] group cursor-pointer" onClick={joinVoice}>
        <div className="flex items-center gap-1.5 text-[#949ba4] group-hover:text-[#dcddde] text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 9.75v4.5M8.464 8.464a5 5 0 000 7.072" />
          </svg>
          {channelName}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-2 mb-2">
      <div className="bg-[#232428] rounded-lg p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#23a55a] text-xs font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#23a55a] inline-block" /> Sesli Bağlı
          </span>
          <button onClick={leaveVoice} className="text-[#ed4245] hover:text-white text-xs transition-colors">Ayrıl</button>
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-bold">
              {user?.username[0].toUpperCase()}
            </div>
            <span className="text-[10px] text-[#949ba4] truncate max-w-[36px]">{user?.username}</span>
          </div>
          {Array.from(peers.values()).map(p => (
            <div key={p.socketId} className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-[#ed4245] flex items-center justify-center text-white text-xs font-bold">
                {p.username[0]?.toUpperCase()}
              </div>
              <span className="text-[10px] text-[#949ba4] truncate max-w-[36px]">{p.username}</span>
            </div>
          ))}
        </div>

        {sharing && (
          <video ref={screenVideoRef} muted className="w-full rounded mb-2 max-h-32 object-contain bg-black" />
        )}

        <div className="flex gap-1">
          <button onClick={toggleMute}
            className={`flex-1 py-1 rounded text-xs font-semibold transition-colors ${muted ? 'bg-[#ed4245] text-white' : 'bg-[#383a40] text-[#949ba4] hover:text-white'}`}>
            {muted ? 'Sesi Aç' : 'Sustur'}
          </button>
          <button onClick={sharing ? stopScreenShare : startScreenShare}
            className={`flex-1 py-1 rounded text-xs font-semibold transition-colors ${sharing ? 'bg-[#5865f2] text-white' : 'bg-[#383a40] text-[#949ba4] hover:text-white'}`}>
            {sharing ? 'Paylaşımı Durdur' : 'Ekran Paylaş'}
          </button>
        </div>
      </div>
    </div>
  );
}

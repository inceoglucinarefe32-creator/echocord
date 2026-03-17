import { create } from 'zustand';

export interface Channel {
  id: string;
  server_id: string;
  name: string;
  type: 'text' | 'voice';
}

export interface ServerMember {
  id: string;
  username: string;
  avatar: string | null;
  status: string;
}

export interface EchoServer {
  id: string;
  name: string;
  icon: string | null;
  owner_id: string;
  invite_code: string;
  channels: Channel[];
  members: ServerMember[];
}

export interface Message {
  id: string;
  channel_id?: string;
  dm_channel_id?: string;
  user_id: string;
  username: string;
  avatar: string | null;
  content: string;
  created_at: number;
}

export interface DM {
  id: string;
  user_id: string;
  username: string;
  avatar: string | null;
  status: string;
}

interface AppState {
  servers: EchoServer[];
  activeServerId: string | null;
  activeChannelId: string | null;
  activeDMId: string | null;
  activeDMUser: { id: string; username: string; avatar: string | null; status: string } | null;
  messages: Message[];
  dms: DM[];
  voiceChannelId: string | null;
  voiceMembers: Record<string, { socketId: string; userId: string; username: string }[]>;
  memberStatuses: Record<string, string>;

  setServers: (servers: EchoServer[]) => void;
  addServer: (server: EchoServer) => void;
  removeServer: (id: string) => void;
  updateServer: (server: EchoServer) => void;
  setActiveServer: (id: string | null) => void;
  setActiveChannel: (id: string | null) => void;
  setActiveDM: (dm: DM | null, user: AppState['activeDMUser']) => void;
  setMessages: (msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  setDMs: (dms: DM[]) => void;
  setVoiceChannel: (id: string | null) => void;
  setVoiceMembers: (channelId: string, members: { socketId: string; userId: string; username: string }[]) => void;
  setMemberStatus: (userId: string, status: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  servers: [],
  activeServerId: null,
  activeChannelId: null,
  activeDMId: null,
  activeDMUser: null,
  messages: [],
  dms: [],
  voiceChannelId: null,
  voiceMembers: {},
  memberStatuses: {},

  setServers: (servers) => set({ servers }),
  addServer: (server) => set((s) => ({ servers: [...s.servers, server] })),
  removeServer: (id) => set((s) => ({ servers: s.servers.filter(sv => sv.id !== id) })),
  updateServer: (server) => set((s) => ({ servers: s.servers.map(sv => sv.id === server.id ? server : sv) })),
  setActiveServer: (id) => set({ activeServerId: id, activeChannelId: null, activeDMId: null }),
  setActiveChannel: (id) => set({ activeChannelId: id, activeDMId: null, messages: [] }),
  setActiveDM: (dm, user) => set({ activeDMId: dm?.id ?? null, activeDMUser: user, activeChannelId: null, messages: [] }),
  setMessages: (msgs) => set({ messages: msgs }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setDMs: (dms) => set({ dms }),
  setVoiceChannel: (id) => set({ voiceChannelId: id }),
  setVoiceMembers: (channelId, members) => set((s) => ({ voiceMembers: { ...s.voiceMembers, [channelId]: members } })),
  setMemberStatus: (userId, status) => set((s) => ({ memberStatuses: { ...s.memberStatuses, [userId]: status } })),
}));

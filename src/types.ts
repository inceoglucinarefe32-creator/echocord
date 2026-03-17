export interface Message {
  id: string;
  channelId: string;
  content: string;
  author: string;
  avatarColor: string;
  timestamp: Date;
  isSecret?: boolean;
  secretRevealedBy?: string[];
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  isLocked?: boolean;
  password?: string;
  category: string;
}

export interface User {
  id: string;
  name: string;
  avatarColor: string;
}

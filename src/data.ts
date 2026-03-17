import type { User, Channel, Message } from './types';

const adjectives = ['Gizli', 'Karanlık', 'Sessiz', 'Hızlı', 'Gizemli', 'Yalnız', 'Derin', 'Bilinmez', 'Kayıp', 'Ücra'];
const nouns = ['Tilki', 'Kurt', 'Kartal', 'Kaplan', 'Panter', 'Kobra', 'Şahin', 'Aslan', 'Ejder', 'Gölge'];
const colors = ['#5865f2', '#eb459e', '#fee75c', '#57f287', '#ed4245', '#ffa500', '#00b0f4', '#c084fc'];

export function generateAnonUser(): User {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9999);
  const color = colors[Math.floor(Math.random() * colors.length)];
  return {
    id: crypto.randomUUID(),
    name: `${adj}${noun}#${num.toString().padStart(4, '0')}`,
    avatarColor: color,
  };
}

export const CHANNELS: Channel[] = [
  { id: 'genel', name: 'genel', description: 'Herkesin konuşabileceği genel kanal', category: 'Genel' },
  { id: 'sohbet', name: 'sohbet', description: 'Günlük sohbet', category: 'Genel' },
  { id: 'sikayet', name: 'sikayet', description: 'Anonim şikayetlerinizi buraya yazın', category: 'Anonim' },
  { id: 'itiraf', name: 'itiraf', description: 'Kimliğiniz gizli kalır', category: 'Anonim' },
  { id: 'sirlar', name: 'sırlar', description: 'Paylaşılan sırlar yalnızca burada', category: 'Anonim', isLocked: true, password: '1234' },
  { id: 'dedikodu', name: 'dedikodu', description: 'Söylentiler ve dedikodular', category: 'Anonim' },
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    channelId: 'genel',
    content: 'Hoş geldiniz! Burada kimliğiniz tamamen gizlidir.',
    author: 'GizliSistem#0000',
    avatarColor: '#5865f2',
    timestamp: new Date(Date.now() - 60000 * 10),
  },
  {
    id: '2',
    channelId: 'genel',
    content: 'Mesajlarınız anonim olarak gönderilir. Kimse kim olduğunuzu bilemez.',
    author: 'GizliSistem#0000',
    avatarColor: '#5865f2',
    timestamp: new Date(Date.now() - 60000 * 8),
  },
  {
    id: '3',
    channelId: 'itiraf',
    content: 'Geçen gün patronumu dinlemeden işi bitirdim ve hiçbir şey fark etmedi 😅',
    author: 'GizliKurt#4521',
    avatarColor: '#ed4245',
    timestamp: new Date(Date.now() - 60000 * 5),
  },
  {
    id: '4',
    channelId: 'sikayet',
    content: 'Ulaşım fiyatları çok yüksek, artık dayanılmaz hale geldi',
    author: 'SessizPanter#7732',
    avatarColor: '#ffa500',
    timestamp: new Date(Date.now() - 60000 * 3),
  },
];

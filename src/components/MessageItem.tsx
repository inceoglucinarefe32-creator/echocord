import type { Message } from '../types';

interface Props {
  message: Message;
  prevAuthor?: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Bugün';
  if (date.toDateString() === yesterday.toDateString()) return 'Dün';
  return date.toLocaleDateString('tr-TR');
}

export default function MessageItem({ message, prevAuthor }: Props) {
  const isGrouped = prevAuthor === message.author;

  if (isGrouped) {
    return (
      <div className="pl-[72px] pr-4 py-[1px] hover:bg-[#2e3035] group relative">
        <span className="absolute left-4 top-1 text-[11px] text-[#4e5058] opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(message.timestamp)}
        </span>
        <p className="text-[#dcddde] text-[15px] leading-relaxed break-words">{message.content}</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 px-4 py-1 mt-2 hover:bg-[#2e3035] group">
      <div
        className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm mt-0.5 cursor-pointer"
        style={{ backgroundColor: message.avatarColor }}
      >
        {message.author.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-semibold text-[15px] text-white cursor-pointer hover:underline">{message.author}</span>
          <span className="text-[11px] text-[#949ba4]">
            {formatDate(message.timestamp)} {formatTime(message.timestamp)}
          </span>
        </div>
        <p className="text-[#dcddde] text-[15px] leading-relaxed break-words">{message.content}</p>
      </div>
    </div>
  );
}

import type { Channel } from '../types';

interface Props {
  channels: Channel[];
  activeChannel: string;
  onSelect: (id: string) => void;
  serverName: string;
  unlockedChannels: string[];
}

const categoryOrder = ['Genel', 'Anonim'];

export default function Sidebar({ channels, activeChannel, onSelect, serverName, unlockedChannels }: Props) {
  const grouped: Record<string, Channel[]> = {};
  for (const ch of channels) {
    if (!grouped[ch.category]) grouped[ch.category] = [];
    grouped[ch.category].push(ch);
  }

  return (
    <div className="flex h-full">
      {/* Server list mockup */}
      <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-2 shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-[#5865f2] flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:rounded-xl transition-all">
          GS
        </div>
        <div className="w-8 h-[2px] bg-[#2c2d31] rounded-full my-1" />
        {['A', 'B', 'C'].map((l) => (
          <div key={l} className="w-12 h-12 rounded-full bg-[#313338] flex items-center justify-center text-[#dcddde] text-sm cursor-pointer hover:rounded-xl hover:bg-[#5865f2] transition-all">
            {l}
          </div>
        ))}
      </div>

      {/* Channel list */}
      <div className="w-60 bg-[#2b2d31] flex flex-col shrink-0">
        <div className="h-12 px-4 flex items-center border-b border-[#1e1f22] shadow-sm cursor-pointer hover:bg-[#35373c] transition-colors">
          <span className="font-bold text-white text-[15px] truncate flex-1">{serverName}</span>
          <svg className="w-4 h-4 text-[#b5bac1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {categoryOrder.map((cat) => (
            <div key={cat} className="mb-2">
              <div className="px-4 py-1 text-[11px] font-semibold text-[#949ba4] uppercase tracking-wide flex items-center gap-1">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                {cat}
              </div>
              {(grouped[cat] || []).map((ch) => {
                const isActive = activeChannel === ch.id;
                const isLocked = ch.isLocked && !unlockedChannels.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    onClick={() => onSelect(ch.id)}
                    className={`w-full text-left px-2 mx-2 py-[6px] rounded flex items-center gap-1.5 text-[15px] transition-colors group ${
                      isActive
                        ? 'bg-[#404249] text-white'
                        : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dcddde]'
                    }`}
                    style={{ width: 'calc(100% - 16px)' }}
                  >
                    <span className="text-[#949ba4] text-lg leading-none">#</span>
                    <span className="truncate flex-1">{ch.name}</span>
                    {isLocked && (
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User panel */}
        <div className="h-[52px] bg-[#232428] px-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-xs font-bold text-white">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-white leading-none truncate">Anonim</div>
            <div className="text-[11px] text-[#b5bac1] leading-none mt-0.5">Gizli Mod</div>
          </div>
          <div className="flex gap-1">
            <button className="w-8 h-8 rounded flex items-center justify-center text-[#b5bac1] hover:bg-[#35373c] hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import type { Channel } from '../types';

interface Props {
  channel: Channel;
  onUnlock: (channelId: string, password: string) => boolean;
}

export default function LockedChannel({ channel, onUnlock }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onUnlock(channel.id, password);
    if (!success) {
      setError('Yanlış şifre. Tekrar deneyin.');
      setPassword('');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#313338]">
      <div className="bg-[#2b2d31] rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-xl border border-[#1e1f22]">
        <div className="w-16 h-16 bg-[#1e1f22] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#5865f2]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-white font-bold text-xl mb-2">#{channel.name}</h2>
        <p className="text-[#949ba4] text-sm mb-6">Bu kanal şifre korumalıdır. Girmek için şifreyi girin.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="Şifre girin..."
            className="bg-[#1e1f22] text-white rounded px-3 py-2.5 outline-none border border-[#3a3c42] focus:border-[#5865f2] text-sm placeholder-[#949ba4]"
          />
          {error && <p className="text-[#ed4245] text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-[#5865f2] hover:bg-[#4752c4] text-white rounded py-2.5 font-semibold text-sm transition-colors"
          >
            Kilidi Aç
          </button>
        </form>
        <p className="text-[#4e5058] text-xs mt-4">Ipucu: 1234</p>
      </div>
    </div>
  );
}

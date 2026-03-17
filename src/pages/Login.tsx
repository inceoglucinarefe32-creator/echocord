import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

interface Props { onSwitch: () => void; }

export default function Login({ onSwitch }: Props) {
  const login = useAuthStore(s => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); }
    catch (err: any) { setError(err.response?.data?.error || 'Giriş başarısız'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#313338] flex items-center justify-center p-4">
      <div className="bg-[#2b2d31] rounded-lg p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#5865f2] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
            </div>
            <span className="text-white font-bold text-2xl">Echo<span className="text-[#5865f2]">Cord</span></span>
          </div>
          <h1 className="text-white text-2xl font-bold">Tekrar hoş geldin!</h1>
          <p className="text-[#949ba4] mt-1">Giriş yaparak devam et</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="text-[#b5bac1] text-xs font-semibold uppercase tracking-wide block mb-1.5">E-posta</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
              className="w-full bg-[#1e1f22] text-white rounded px-3 py-2.5 outline-none border border-[#3a3c42] focus:border-[#5865f2] text-sm placeholder-[#6d6f78]"
              placeholder="ornek@mail.com" />
          </div>
          <div>
            <label className="text-[#b5bac1] text-xs font-semibold uppercase tracking-wide block mb-1.5">Şifre</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required
              className="w-full bg-[#1e1f22] text-white rounded px-3 py-2.5 outline-none border border-[#3a3c42] focus:border-[#5865f2] text-sm placeholder-[#6d6f78]"
              placeholder="••••••••" />
          </div>
          {error && <p className="text-[#ed4245] text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-60 text-white rounded py-2.5 font-semibold text-sm transition-colors mt-1">
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p className="text-[#949ba4] text-sm mt-4 text-center">
          Hesabın yok mu?{' '}
          <button onClick={onSwitch} className="text-[#5865f2] hover:underline">Kayıt ol</button>
        </p>
      </div>
    </div>
  );
}

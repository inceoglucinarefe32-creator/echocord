import { useState, useRef } from 'react';
import api from '../api';
import { useAuthStore } from '../store/authStore';

interface Props { onClose: () => void; }

export default function UserSettingsModal({ onClose }: Props) {
  const user = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);
  const logout = useAuthStore(s => s.logout);
  const [username, setUsername] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('username', username);
      if (fileRef.current?.files?.[0]) fd.append('avatar', fileRef.current.files[0]);
      const { data } = await api.patch('/me', fd);
      updateUser(data);
      setMsg('Kaydedildi!');
    } catch { setMsg('Hata oluştu'); }
    finally { setSaving(false); }
  };

  const avatarUrl = user?.avatar ? `http://localhost:3001${user.avatar}` : null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#2b2d31] rounded-lg w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-white font-bold text-xl mb-6">Profil Ayarları</h2>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
            {avatarUrl
              ? <img src={avatarUrl} className="w-20 h-20 rounded-full object-cover" />
              : <div className="w-20 h-20 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-2xl font-bold">
                  {user?.username[0].toUpperCase()}
                </div>}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-white font-semibold">{user?.username}</p>
            <p className="text-[#949ba4] text-sm">{user?.email}</p>
            <p className="text-[#949ba4] text-xs mt-1">Fotoğraf değiştirmek için tıkla</p>
          </div>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" />

        <div className="mb-4">
          <label className="text-[#b5bac1] text-xs font-semibold uppercase tracking-wide block mb-1.5">Kullanıcı Adı</label>
          <input value={username} onChange={e => setUsername(e.target.value)}
            className="w-full bg-[#1e1f22] text-white rounded px-3 py-2.5 outline-none border border-[#3a3c42] focus:border-[#5865f2] text-sm" />
        </div>

        {msg && <p className="text-[#23a55a] text-sm mb-3">{msg}</p>}

        <div className="flex gap-2 mt-4">
          <button onClick={save} disabled={saving}
            className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-60 text-white rounded py-2 font-semibold text-sm transition-colors">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <button onClick={onClose} className="flex-1 bg-[#383a40] hover:bg-[#404249] text-white rounded py-2 font-semibold text-sm transition-colors">
            Kapat
          </button>
        </div>

        <button onClick={logout} className="w-full mt-3 bg-[#ed4245] hover:bg-[#c03537] text-white rounded py-2 font-semibold text-sm transition-colors">
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

/** Clears the httpOnly admin session cookie via /api/admin-session. */
export function AdminSignOut() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await fetch('/api/admin-session', { method: 'DELETE' });
      router.refresh();
    } catch (err) {
      console.error('Failed to sign out of admin session:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={busy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
    >
      <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{busy ? 'Đang thoát...' : 'Thoát quản trị'}</span>
    </button>
  );
}

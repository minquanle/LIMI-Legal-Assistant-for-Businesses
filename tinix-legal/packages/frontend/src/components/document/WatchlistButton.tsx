'use client';
import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';

export function WatchlistButton({ documentId }: { documentId: string }) {
  const [isWatched, setIsWatched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
  const userId = 'demo-user';

  useEffect(() => {
    fetch(`${backendUrl}/api/watchlist?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        setIsWatched(data.some((item: any) => item.documentId === documentId));
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [documentId, backendUrl]);

  const toggleWatchlist = async () => {
    setIsToggling(true);
    try {
      if (isWatched) {
        await fetch(`${backendUrl}/api/watchlist`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, documentId })
        });
        setIsWatched(false);
      } else {
        await fetch(`${backendUrl}/api/watchlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, documentId })
        });
        setIsWatched(true);
      }
    } catch(err) {
      console.error(err);
    }
    setIsToggling(false);
  };

  return (
    <button
      onClick={toggleWatchlist}
      disabled={isLoading || isToggling}
      aria-busy={isToggling}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-70 ${isWatched ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
    >
      {isToggling ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : isWatched ? (
        <Bell className="w-4 h-4 fill-indigo-600" aria-hidden="true" />
      ) : (
        <BellOff className="w-4 h-4 text-slate-400" aria-hidden="true" />
      )}
      {isToggling ? 'Đang xử lý...' : isWatched ? 'Đang theo dõi' : 'Theo dõi'}
    </button>
  );
}

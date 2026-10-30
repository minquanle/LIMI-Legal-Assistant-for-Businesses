'use client';

import React from 'react';

export function PresenceAvatars() {
  const users = [
    { name: 'Nguyễn Văn A', role: 'Trưởng phòng', color: 'bg-indigo-600', initial: 'NA' },
    { name: 'Trần Văn B', role: 'Chuyên viên', color: 'bg-purple-600', initial: 'TB' }
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-1 hidden sm:inline">Đang xem:</span>
      <div className="flex -space-x-2 overflow-hidden">
        {users.map((u, i) => (
          <div
            key={i}
            title={`${u.name} (${u.role})`}
            className={`inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 ${u.color} text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow-xs`}
          >
            {u.initial}
          </div>
        ))}
      </div>
    </div>
  );
}

import React from 'react';
import { cookies } from 'next/headers';
import {
  ADMIN_COOKIE_NAME,
  isAdminAuthConfigured,
  verifySessionToken,
} from '@/lib/admin-session';
import { AdminLogin } from './components/AdminLogin';
import { AdminSignOut } from './components/AdminSignOut';

/**
 * Gates every /admin/* route server-side. Without a valid session cookie the
 * admin markup is never sent to the browser at all — the visitor only receives
 * the login form.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const authenticated = verifySessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {authenticated ? (
          <>
            <div className="flex justify-end mb-4">
              <AdminSignOut />
            </div>
            {children}
          </>
        ) : (
          <AdminLogin configured={isAdminAuthConfigured()} />
        )}
      </div>

      {/* Admin Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        Tinix Legal Operations &amp; Data Governance System © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

import Link from 'next/link';
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthStatus } from '@/components/auth/AuthStatus';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-12 pt-8 md:flex-row">
        <aside className="w-full rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm md:sticky md:top-6 md:w-64 md:self-start">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">LiftBrain</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Coach cockpit</h2>
          <nav className="mt-6 space-y-2 text-sm font-medium text-slate-600">
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/workouts', label: 'Workouts' },
              { href: '/history', label: 'History' },
              { href: '/ai-coach', label: 'AI Coach' },
              { href: '/settings', label: 'Settings' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <AuthStatus email={session.user.email} />
        </aside>
        <main className="w-full flex-1 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">{children}</main>
      </div>
    </div>
  );
}

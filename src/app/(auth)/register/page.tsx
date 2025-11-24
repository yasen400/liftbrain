import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { authOptions } from '@/lib/auth';

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/dashboard');
  }

  return (
    <>
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">LiftBrain</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Create account</h1>
        <p className="text-sm text-slate-500">Small-team personal strength OS</p>
      </div>
      <div className="mt-6">
        <RegisterForm />
      </div>
    </>
  );
}

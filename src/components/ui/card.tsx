import { PropsWithChildren } from 'react';
import clsx from 'clsx';

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx('rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="space-y-1">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">{title}</h3>
      {description ? <p className="text-sm text-gray-500">{description}</p> : null}
    </header>
  );
}

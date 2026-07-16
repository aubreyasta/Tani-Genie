import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return <div className={['card', className].filter(Boolean).join(' ')}>{children}</div>;
}

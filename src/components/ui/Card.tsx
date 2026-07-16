import type { ReactNode } from 'react';

interface CardProps {
  readonly children: ReactNode;
  readonly style?: React.CSSProperties;
  readonly ariaLabelledby?: string;
}

export function Card({ children, style, ariaLabelledby }: CardProps): React.JSX.Element {
  return (
    <section
      aria-labelledby={ariaLabelledby}
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-primary)',
        padding: 'var(--space-4)',
        ...style,
      }}
    >
      {children}
    </section>
  );
}

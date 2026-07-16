import { RetryButton } from './RetryButton';

export function ErrorState({ message }: { readonly message: string }): React.JSX.Element {
  return (
    <section className="page-shell">
      <div className="verdict-card verdict-danger">
        <h1 style={{ margin: 0 }}>Ada kendala</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
        <RetryButton />
      </div>
    </section>
  );
}

import { RetryButton } from './RetryButton';

export function ErrorState({ message }: { message: string }) {
  return (
    <section className="page-shell">
      <div className="verdict-card verdict-danger">
        <h1 className="flush">Ada kendala</h1>
        <p className="muted">{message}</p>
        <RetryButton />
      </div>
    </section>
  );
}

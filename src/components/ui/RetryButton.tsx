'use client';

export function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="button button-secondary"
    >
      Coba lagi
    </button>
  );
}

interface CacheEntry<T> {
  readonly expiresAt: number;
  readonly value: Promise<T>;
}

export class AsyncTtlCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string, load: () => Promise<T>, force = false): Promise<T> {
    const current = this.entries.get(key);
    if (!force && current && current.expiresAt > Date.now()) {
      return current.value;
    }

    const value = load().catch((error: unknown) => {
      this.entries.delete(key);
      throw error;
    });
    this.entries.set(key, { expiresAt: Date.now() + this.ttlMs, value });
    return value;
  }

  delete(key: string): void {
    this.entries.delete(key);
  }
}

export function envTimeout(name: string, fallbackMs: number): number {
  const configured = Number(process.env[name]);
  return Number.isFinite(configured) && configured > 0 ? configured : fallbackMs;
}

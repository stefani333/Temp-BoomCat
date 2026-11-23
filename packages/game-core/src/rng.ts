export interface RngHolder {
  rngState: number;
}

export function createRngState(seed: number): number {
  const normalized = seed >>> 0;
  return normalized === 0 ? 0x9e3779b9 : normalized;
}

export function nextRandom(holder: RngHolder): number {
  let t = (holder.rngState += 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1) >>> 0;
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  holder.rngState = t >>> 0;
  return value;
}

export function randomInt(holder: RngHolder, maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  return Math.floor(nextRandom(holder) * maxExclusive);
}

export function shuffleInPlace<T>(items: T[], holder: RngHolder): void {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = randomInt(holder, i + 1);
    const a = items[i];
    const b = items[j];
    if (a === undefined || b === undefined) continue;
    items[i] = b;
    items[j] = a;
  }
}

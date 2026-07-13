export type RandomSource = () => number;

export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed: string): RandomSource {
  let state = hashSeed(seed) || 0x9e3779b9;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(min: number, max: number, rng: RandomSource = Math.random): number {
  const lower = Math.ceil(min);
  const upper = Math.floor(max);
  return Math.floor(rng() * (upper - lower + 1)) + lower;
}

export function randomDecimal(
  min: number,
  max: number,
  decimals: number,
  rng: RandomSource = Math.random
): number {
  const factor = 10 ** decimals;
  const value = min + rng() * (max - min);
  return Math.round(value * factor) / factor;
}

export function chooseRandom<T>(array: T[], rng: RandomSource = Math.random): T {
  if (array.length === 0) {
    throw new Error("Cannot choose from an empty array.");
  }
  return array[randomInt(0, array.length - 1, rng)];
}

export function shuffle<T>(array: T[], rng: RandomSource = Math.random): T[] {
  const clone = [...array];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index, rng);
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

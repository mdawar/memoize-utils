import type { AnyFunction, MemoizedFunction } from './types.js';

export function memoize<Fn extends AnyFunction, CacheID>(fn: Fn): MemoizedFunction<Fn> {
  const cache = new Map<CacheID, ReturnType<Fn>>();

  return function (this: ThisParameterType<Fn>, ...args: Parameters<Fn>) {
    // TODO: use hash function
    const key = args[0] as CacheID;

    if (cache.has(key)) return cache.get(key)!;

    const value = fn.apply(this, args) as ReturnType<Fn>;

    cache.set(key, value);

    return value;
  };
}

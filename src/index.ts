import type { AnyFunction, MemoizeOptions, MemoizedFunction } from './types.js';

export function memoize<Fn extends AnyFunction, CacheID>(
  fn: Fn,
  {
    cache: cacheFactory = new Map<CacheID, ReturnType<Fn>>(),
    cacheRejectedPromise = false,
  }: MemoizeOptions<Fn, CacheID> = {}
): MemoizedFunction<Fn> {
  const cache = typeof cacheFactory === 'function' ? cacheFactory() : cacheFactory;

  return function (this: ThisParameterType<Fn>, ...args: Parameters<Fn>) {
    // TODO: use hash function
    const key = args[0] as CacheID;

    if (cache.has(key)) return cache.get(key)!;

    const value = fn.apply(this, args) as ReturnType<Fn>;

    cache.set(key, value);

    if (value instanceof Promise) {
      return value.catch((error: unknown) => {
        if (!cacheRejectedPromise) {
          cache.delete(key);
        }

        throw error;
      }) as ReturnType<Fn>;
    } else {
      return value;
    }
  };
}

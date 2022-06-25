import type { AnyFunction, MemoizeOptions, MemoizedFunction, CacheContent } from './types.js';

export function memoize<Fn extends AnyFunction, CacheID>(
  fn: Fn,
  {
    maxAge,
    cache: cacheFactory = new Map<CacheID, CacheContent<Fn>>(),
    cacheId,
    cacheRejectedPromise = false,
    cacheFromContext,
  }: MemoizeOptions<Fn, CacheID> = {}
): MemoizedFunction<Fn> {
  const globalCache = typeof cacheFactory === 'function' ? cacheFactory() : cacheFactory;

  const memoized = function (this: ThisParameterType<Fn>, ...args: Parameters<Fn>) {
    const cache = cacheFromContext?.call(this) ?? globalCache;
    // Default to first argument
    const key = cacheId ? cacheId(...args) : (args[0] as CacheID);

    // Return cached value if available and hasn't expired
    if (cache.has(key)) {
      const cached = cache.get(key)!;

      const isExpired =
        typeof maxAge === 'number' && typeof cached?.timestamp === 'number'
          ? maxAge === 0 || Date.now() - cached.timestamp > maxAge
          : false;

      if (!isExpired) {
        return cached?.value;
      }
    }

    const value = fn.apply(this, args) as ReturnType<Fn>;

    cache.set(key, { value, timestamp: Date.now() });

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

  // Keep the original function's name
  Object.defineProperty(memoized, 'name', { value: fn.name });

  return memoized;
}

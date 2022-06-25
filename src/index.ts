import type { AnyFunction, MemoizeOptions, MemoizedFunction, CacheContent } from './types.js';

/**
 * [Memoize](https://en.wikipedia.org/wiki/Memoization) function - Cache results of expensive function calls.
 *
 * The memoized function returns the cached result when the same inputs occur again.
 *
 * @param fn - Function to cache its results.
 * @param options - Memoization options.
 * @param options.maxAge - Cached result expiration duration in milliseconds.
 * @param options.cache - Custom cache instance or function returning a cache instance.
 * @param options.cacheId - Custom cache ID function, to be used to determine the ID of the cached result.
 * @param options.cacheRejectedPromise - Cache the rejected promise when memoizing an async function.
 * @param options.cacheFromContext - Function returning a custom cache instance that has access to the original function's context `this`.
 * @returns Memoized function.
 */
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

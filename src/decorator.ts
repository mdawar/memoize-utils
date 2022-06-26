import type { AnyFunction, MemoizeOptions, Cache, CacheContent } from './types.js';

import { memoize as memoizeFn } from './index.js';

/**
 * [Memoize](https://en.wikipedia.org/wiki/Memoization) decorator - Cache results of expensive class methods and getters.
 *
 * @param options - Memoization options.
 * @param options.maxAge - Cached result expiration duration in milliseconds.
 * @param options.cache - Custom cache instance or function returning a cache instance.
 * @param options.cacheId - Custom cache ID function, to be used to determine the ID of the cached result.
 * @param options.cacheRejectedPromise - Cache the rejected promise when memoizing an async function.
 * @param options.cacheFromContext - Function returning a custom cache instance that has access to the original function's context `this`.
 * @returns Memoized class method or getter.
 */
export function memoize<Fn extends AnyFunction, CacheID>({
  cache = () => new Map<CacheID, CacheContent<Fn>>(),
  ...options
}: MemoizeOptions<Fn, CacheID> = {}) {
  const cacheMap = new WeakMap<object, Cache<CacheID, CacheContent<Fn>>>();

  // In this case `this` is going to be the class instance
  function cacheFromContext(this: any) {
    if (!cacheMap.has(this)) {
      cacheMap.set(this, typeof cache === 'function' ? cache() : cache);
    }

    return cacheMap.get(this)!;
  }

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
    if (typeof descriptor?.value === 'function') {
      // Method
      descriptor.value = memoizeFn(descriptor.value as Fn, { cacheFromContext, ...options });
    } else if (typeof descriptor?.get === 'function') {
      // Accessor
      descriptor.get = memoizeFn(descriptor.get as Fn, { cacheFromContext, ...options });
    } else {
      throw new Error('Memoize decorator can only be used on a method or a getter.');
    }
  };
}

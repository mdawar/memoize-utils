import type { AnyFunction, MemoizeOptions, Cache, CacheContent } from './types.js';

import { memoize } from './index.js';

export function memoizeDecorator<Fn extends AnyFunction, CacheID>(
  options: MemoizeOptions<Fn, CacheID> = {}
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
    if (typeof descriptor?.value === 'function') {
      // Method
      descriptor.value = createMemoizedFn(descriptor.value, options);
    } else if (typeof descriptor?.get === 'function') {
      // Accessor
      descriptor.get = createMemoizedFn(descriptor.get, options);
    } else {
      throw new Error('Memoize decorator can only be used on a method or a getter.');
    }
  };
}

function createMemoizedFn<Fn extends AnyFunction, CacheID>(
  fn: Fn,
  {
    cache = () => new Map<CacheID, CacheContent<Fn>>(),
    ...options
  }: MemoizeOptions<Fn, CacheID> = {}
) {
  const cacheMap = new WeakMap<object, Cache<CacheID, CacheContent<Fn>>>();

  // In this case `this` is going to be the class instance
  function cacheFromContext(this: any) {
    if (!cacheMap.has(this)) {
      cacheMap.set(this, typeof cache === 'function' ? cache() : cache);
    }

    return cacheMap.get(this)!;
  }

  return memoize(fn, { cacheFromContext, ...options });
}

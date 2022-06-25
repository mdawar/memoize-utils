export type AnyFunction = (...args: readonly any[]) => unknown;

export type MemoizedFunction<Fn extends AnyFunction> = (...args: Parameters<Fn>) => ReturnType<Fn>;

export interface Cache<K, V> {
  set(key: K, value: V): this;
  get(key: K): V | undefined;
  has(key: K): boolean;
  delete(key: K): boolean;
}

export interface CachedData<ValueType> {
  value: ValueType;
  timestamp: number;
}

export type CacheContent<Fn extends AnyFunction> = CachedData<ReturnType<Fn>>;

export interface MemoizeOptions<Fn extends AnyFunction, CacheID> {
  /**
   * Cache expiration duration in milliseconds.
   *
   * By default the cached results do not expire.
   */
  maxAge?: number;

  /**
   * Custom cache instance or factory function.
   *
   * The cache instance must implement at least the following methods:
   * - `.set(key, value)`
   * - `.get(key)`
   * - `.has(key)`
   * - `.delete(key)`
   */
  cache?: Cache<CacheID, CacheContent<Fn>> | (() => Cache<CacheID, CacheContent<Fn>>);

  /**
   * Function that determines the cache ID from the function's arguments.
   *
   * By default the first argument is used as the cache ID.
   */
  cacheId?: (...args: Parameters<Fn>) => CacheID;

  /**
   * Cache rejected promise (To be used when memoizing async functions).
   *
   * By default rejected promises are not cached.
   */
  cacheRejectedPromise?: boolean;

  /**
   * Provide a custom cache instance that requires the function's context (`this`).
   *
   * To be used when the cache instance is retrieved from the context (`this`).
   *
   * This function is called on every memoized function's call to retrieve the cache instance.
   *
   * For example this function is used for the `memoize` decorator to provide a separate cache
   * instance for each class instance.
   */
  cacheFromContext?: () => Cache<CacheID, CacheContent<Fn>>;
}

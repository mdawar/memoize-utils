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
  maxAge?: number;
  cache?: Cache<CacheID, CacheContent<Fn>> | (() => Cache<CacheID, CacheContent<Fn>>);
  cacheRejectedPromise?: boolean;
}

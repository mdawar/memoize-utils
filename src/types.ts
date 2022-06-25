export type AnyFunction = (...args: readonly any[]) => unknown;

export type MemoizedFunction<Fn extends AnyFunction> = (...args: Parameters<Fn>) => ReturnType<Fn>;

export interface Cache<K, V> {
  set(key: K, value: V): this;
  get(key: K): V | undefined;
  has(key: K): boolean;
  delete(key: K): boolean;
}

export interface MemoizeOptions<Fn extends AnyFunction, CacheID> {
  cache?: Cache<CacheID, ReturnType<Fn>> | (() => Cache<CacheID, ReturnType<Fn>>);
  cacheRejectedPromise?: boolean;
}

export type AnyFunction = (...args: readonly any[]) => unknown;

export type MemoizedFunction<Fn extends AnyFunction> = (...args: Parameters<Fn>) => ReturnType<Fn>;

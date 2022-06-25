import { jest } from '@jest/globals';

import { memoize } from '../src/index.js';

const ERROR_MSG = 'Failed';

/** Sync function factory. */
function makeFn() {
  let throwNext = false;

  return function (...agrs: any[]) {
    throwNext = !throwNext;

    if (throwNext) {
      throw new Error(ERROR_MSG);
    }

    return true;
  };
}

/** Async function factory. */
function makeAsyncFn() {
  let throwNext = false;

  return async function (...agrs: any[]) {
    throwNext = !throwNext;

    if (throwNext) {
      throw new Error(ERROR_MSG);
    }

    return true;
  };
}

/** Sync counter function factory. */
function makeCounter() {
  let count = 0;
  return (...agrs: any[]) => count++;
}

/** Async counter function factory. */
function makeAsyncCounter() {
  let count = 0;
  return async (...agrs: any[]) => count++;
}

describe('Factory functions', () => {
  test('Synchronous function', () => {
    const fn = makeFn();

    expect(() => fn()).toThrow('Failed');
    expect(fn()).toBe(true);
  });

  test('Async function', async () => {
    const asyncFn = makeAsyncFn();

    await expect(asyncFn()).rejects.toThrow('Failed');
    await expect(asyncFn()).resolves.toBe(true);
  });

  test('Synchronous counter function', () => {
    const counter = makeCounter();

    expect(counter()).toBe(0);
    expect(counter()).toBe(1);
    expect(counter()).toBe(2);
  });

  test('Async counter function', async () => {
    const counter = makeAsyncCounter();

    expect(await counter()).toBe(0);
    expect(await counter()).toBe(1);
    expect(await counter()).toBe(2);
  });
});

describe('Basic functionality', () => {
  test('Function result is cached', () => {
    const counter = makeCounter();
    const memoized = memoize(counter);

    expect(memoized()).toEqual(0);
    expect(memoized()).toEqual(memoized());
  });

  test("Sync function's memoized function does not return a Promise", () => {
    const counter = makeCounter();
    const memoized = memoize(counter);

    expect(memoized()).not.toBeInstanceOf(Promise);
  });

  test("Async function's memoized function returns a Promise", async () => {
    const counter = makeAsyncCounter();
    const memoized = memoize(counter);

    expect(memoized()).toBeInstanceOf(Promise);
  });

  test("Async function's promise is cached", async () => {
    const counter = makeAsyncCounter();
    const memoized = memoize(counter);

    expect(await memoized()).toEqual(0);
    expect(await memoized()).toEqual(await memoized());
  });

  test('Context bound to memoized function is passed to the original function', async () => {
    async function originalFunction(this: any, ...agrs: any[]) {
      return ++this.index;
    }

    const context = { index: 0 };

    const memoized = memoize(originalFunction).bind(context);

    expect(await memoized()).toEqual(1);
    expect(context).toEqual({ index: 1 });

    expect(await memoized()).toEqual(await memoized());
    expect(context).toEqual({ index: 1 });

    expect(await memoized('')).toEqual(2);
    expect(context).toEqual({ index: 2 });
  });

  test('Function name is preserved', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(memoize(async function example() {}).name).toEqual('example');
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(memoize(() => {}).name).toEqual('');
  });
});

describe('Errors and Promise rejections', () => {
  test('Function throwing an error', () => {
    const fn = makeFn();
    const memoized = memoize(fn);

    expect(() => memoized()).toThrow(ERROR_MSG);
    expect(memoized()).toBe(true);
  });

  test("Async function's rejected promise not cached by default", async () => {
    const asyncFn = makeAsyncFn();
    const memoized = memoize(asyncFn);

    await expect(memoized()).rejects.toThrow(ERROR_MSG);
    // Rejected promises are not cached by default
    await expect(memoized()).resolves.toBe(true);
  });

  test("Async function's rejected promise cached on demand", async () => {
    const asyncFn = makeAsyncFn();
    const memoized = memoize(asyncFn, { cacheRejectedPromise: true });

    await expect(memoized()).rejects.toThrow(ERROR_MSG);
    await expect(memoized()).rejects.toThrow(ERROR_MSG);
  });
});

describe('Custom cache', () => {
  test('Using a custom cache', async () => {
    const cache = new Map();
    const memoized = memoize(makeAsyncCounter(), { cache });

    expect(await memoized('a')).toEqual(0);
    expect(await memoized('a')).toEqual(0);
    expect(await memoized('b')).toEqual(1);
    expect(await memoized('b')).toEqual(1);

    expect(cache.size).toBe(2);

    cache.clear();

    expect(await memoized('a')).toEqual(2);
    expect(await memoized('b')).toEqual(3);
  });

  test('Using a cache factory function', async () => {
    const cache = new Map();
    const cacheFactoryMock = jest.fn(() => cache);
    const memoized = memoize(makeAsyncCounter(), { cache: cacheFactoryMock });

    expect(await memoized('a')).toEqual(0);
    expect(await memoized('a')).toEqual(0);
    expect(await memoized('b')).toEqual(1);
    expect(await memoized('b')).toEqual(1);

    expect(cacheFactoryMock).toHaveBeenCalledTimes(1);
    expect(cacheFactoryMock).toHaveBeenCalledWith();

    expect(cache.size).toBe(2);
  });
});

describe('Cache expiration', () => {
  test('Cache expires when maxAge is defined', async () => {
    const memoized = memoize(makeAsyncCounter(), { maxAge: 5000 });

    const now = Date.now();

    jest.useFakeTimers({ now });
    expect(await memoized()).toBe(0);

    // Less than the expiration time
    jest.useFakeTimers({ now: now + 2000 });
    expect(await memoized()).toBe(0); // cached

    // Exact expiration time
    jest.useFakeTimers({ now: now + 5000 });
    expect(await memoized()).toBe(0); // cached

    // Expired
    jest.useFakeTimers({ now: now + 5001 });
    expect(await memoized()).toBe(1); // new value

    jest.useRealTimers();
  });

  test('Cache expires immediately when maxAge is set to 0', async () => {
    const memoized = memoize(makeAsyncCounter(), { maxAge: 0 });

    expect(await memoized()).toBe(0);
    expect(await memoized()).toBe(1);
    expect(await memoized()).toBe(2);
  });

  test('Cache does not expire when maxAge is set to NaN', async () => {
    const memoized = memoize(makeAsyncCounter(), { maxAge: NaN });

    expect(await memoized()).toBe(0);
    expect(await memoized()).toBe(0);
    expect(await memoized()).toBe(0);
  });

  test('Cache does not expire when maxAge is set to undefined', async () => {
    const memoized = memoize(makeAsyncCounter(), { maxAge: undefined });

    expect(await memoized()).toBe(0);
    expect(await memoized()).toBe(0);
    expect(await memoized()).toBe(0);
  });

  test('Cache does not expire when maxAge is set to null', async () => {
    // @ts-expect-error Using `null` for `maxAge`
    const memoized = memoize(makeAsyncCounter(), { maxAge: null });

    expect(await memoized()).toBe(0);
    expect(await memoized()).toBe(0);
    expect(await memoized()).toBe(0);
  });
});

describe('Custom cache ID', () => {
  test('First argument is used for the cache ID by default', async () => {
    const memoized = memoize(makeAsyncCounter());

    expect(await memoized('a')).toEqual(0);
    expect(await memoized('a', 'b')).toEqual(0);
  });

  test('Using a custom cache ID function', async () => {
    const memoized = memoize(makeAsyncCounter(), {
      cacheId: (...args) => args.map(String).join('-'),
    });

    expect(await memoized('a')).toEqual(0);
    expect(await memoized('a')).toEqual(0);

    expect(await memoized('a', 'b')).toEqual(1);
    expect(await memoized('a', 'b')).toEqual(1);

    expect(await memoized('a', 'b', 1)).toEqual(2);
    expect(await memoized('a', 'b', 1)).toEqual(2);
  });

  test('Using a single cache ID', async () => {
    const memoized = memoize(makeAsyncCounter(), {
      cacheId: () => 'same',
    });

    expect(await memoized('a')).toEqual(0);
    expect(await memoized('a', 'b')).toEqual(0);
    expect(await memoized('a', 'b', 1)).toEqual(0);
  });
});

describe('Objects as arguments', () => {
  test('Objects as arguments are not cached as intended', async () => {
    const memoized = memoize(makeAsyncCounter());

    expect(await memoized({})).toEqual(0);
    expect(await memoized({})).toEqual(1); // Same object shape but different value
    expect(await memoized({})).toEqual(2); // Same object shape but different value
  });

  test('Using the same object reference works', async () => {
    const memoized = memoize(makeAsyncCounter());

    const obj = {};

    expect(await memoized(obj)).toEqual(0);
    expect(await memoized(obj)).toEqual(0);
    expect(await memoized(obj)).toEqual(0);
  });

  test('Objects as arguments with JSON serialization for cache ID', async () => {
    const memoized = memoize(makeAsyncCounter(), {
      cacheId: (...args) => JSON.stringify(args),
    });

    expect(await memoized({})).toEqual(0);
    expect(await memoized({})).toEqual(0);
    expect(await memoized({})).toEqual(0);

    expect(await memoized({ a: 1, b: '2' })).toEqual(1);
    expect(await memoized({ a: 1, b: '2' })).toEqual(1);
  });
});

describe('RegExp as arguments', () => {
  test('RegExp objects as arguments are not cached as intended', async () => {
    const memoized = memoize(makeAsyncCounter());

    expect(await memoized(/(.*)/)).toEqual(0);
    expect(await memoized(/(.*)/)).toEqual(1); // Same object shape but different value
    expect(await memoized(/(.*)/)).toEqual(2); // Same object shape but different value
  });

  test('Using the same RegExp object reference works', async () => {
    const memoized = memoize(makeAsyncCounter());

    const regex = /(.*)/;

    expect(await memoized(regex)).toEqual(0);
    expect(await memoized(regex)).toEqual(0);
    expect(await memoized(regex)).toEqual(0);
  });

  test('Serializing RegExp objects using custom cache ID function', async () => {
    const memoized = memoize(makeAsyncCounter(), { cacheId: (regex: RegExp) => regex.toString() });

    expect(await memoized(/(.*)/)).toEqual(0);
    expect(await memoized(/(.*)/)).toEqual(0);

    expect(await memoized(/(.*)/gi)).toEqual(1);
    expect(await memoized(/(.*)/gi)).toEqual(1);
  });
});

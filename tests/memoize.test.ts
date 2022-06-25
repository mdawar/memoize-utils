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

  test("Async function's memoized function returns Promise", async () => {
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
});

describe('Errors and Promise rejections', () => {
  test('Function throwing an error', () => {
    const fn = makeFn();
    const memoized = memoize(fn);

    expect(() => memoized()).toThrow(ERROR_MSG);
    expect(memoized()).toBe(true);
  });

  test('Async function promise rejection', async () => {
    const asyncFn = makeAsyncFn();
    const memoized = memoize(asyncFn);

    await expect(memoized()).rejects.toThrow(ERROR_MSG);
    // TODO: do not cache promise rejections by default
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

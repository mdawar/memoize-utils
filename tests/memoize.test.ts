import { memoize } from '../src/index.js';

/** Sync function factory. */
function makeFn() {
  let throwNext = false;

  return function (...agrs: any[]) {
    throwNext = !throwNext;

    if (throwNext) {
      throw new Error('Failed');
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
      throw new Error('Failed');
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

describe('Basic tests', () => {
  test('Memoized function result is cached', () => {
    const counter = makeCounter();

    const memoized = memoize(counter);

    expect(memoized()).toEqual(0);
    expect(memoized()).toEqual(memoized());
  });
});

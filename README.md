# memoize-utils

[Memoize](https://en.wikipedia.org/wiki/Memoization) sync and async functions (Returning a `Promise`).

Used to cache expensive function calls, it supports cache expiration and custom cache objects.

Provides:

- `memoize` Function: Used to memoize any sync or `async` function.
- `memoize` Decorator: TypeScript decorator used to memoize class methods and getters.

## Installation

```
$ npm i memoize-utils
```

## Usage

Memoizing a function:

```js
import { memoize } from 'memoize-utils';

async function fetchIP() {
  const response = await fetch('http://httpbin.org/ip');
  return response.json();
}

const memoizedFetchIP = memoize(fetchIP, { maxAge: 2000 });

// The first request is cached
await memoizedFetchIP();

// Subsequent calls return the cached result
await memoizedFetchIP();

// Delay 2 seconds
await new Promise((resolve) => setTimeout(resolve, 2000));

// Cache has expired, make a new request and cache the result
await memoizedFetchIP();
```

Memoizing class methods and getters:

```js
import { memoize } from 'memoize-utils/decorator';

class ExampleClass {
  @memoize({ maxAge: 2000 })
  async fetchIP() {
    const response = await fetch('http://httpbin.org/ip');
    return response.json();
  }

  @memoize({ maxAge: 60 * 60 * 1000 })
  get result() {
    // Some expensive operation
  }
}

const instance = new ExampleClass();

// First call is cached and subsequent calls return the result from the cache until expiration
await instance.fetchIP();
await instance.fetchIP(); // Cached

// First access is cached, any access later returns the cached result until expiration
instance.result;
```

## Custom Cache

By default a `Map()` object is used to store the cached results, any object that implements a similar API can be used instead, for example `WeakMap`.

```js
const cache = new WeakMap();

const memoized = memoize(expensiveFunction, { cache });

// We can also pass a factory function that returns a cache instance
const memoized = memoize(expensiveFunction, {
  cache: () => new WeakMap(),
});
```

## Cache Expiration

Cached results are stored with a timestamp, a `maxAge` option may be passed when creating the memoized function to set the expiration duration of the cache.
The cache expiration is checked when the cache is accessed, so there are no timers that clear the cache automatically, if you need this functionality you can pass a custom `cache` object that supports it.

```js
const memoized = memoize(expensiveFunction, { maxAge: 60 * 60 * 1000 }); // Cache results for 1 hour
```

## Cache ID

By default the first argument of the memoized function is used as the cache ID used to store the result.

```js
const memoized = memoize(expensiveFunction);

// All of these 3 calls are considered the same since we're using the first argument as the cache ID
memoized('a');
memoized('a', 'b'); // Cached
memoized('a', 'b', 1); // Cached
```

To use all the arguments as the cache ID, we can pass a `cacheId` function:

```js
const memoized = memoize(expensiveFunction, {
  // The cacheId function accepts the same arguments as the original function
  // Using `JSON.stringify` assuming all the arguments are JSON serializable
  cacheId: (...args) => JSON.stringify(args),
});

// In this case, each of these calls is cached separately
memoized('a');
memoized('a', 'b');
memoized('a', 'b', 1);
```

## Rejected Promises

By default rejected promises are not cached, this is done to have the same functionality for synchronous functions when throwing errors.
If you want to also cache rejected promises, you can use the `cacheRejectedPromise` option.

```js
// Cache rejected promises
// You might want to use it with `maxAge` so the result expires at some point and the function call is retried
const memoized = memoize(expensiveFunction, { cacheRejectedPromise: true });
```

## Cache From Context

If your cache instance requires the original function's context (`this`), you can use `cacheFromContext` function that have access to same context as the original function and return a cache instance.
For example this function is used to implement the decorator which uses a separate cache for each class instance.

```js
function cacheFromContext() {
  // You have acces to the original function's context
  if (!this.cache) {
    this.cache = new Map();
  }

  return this.cache;
}

const memoized = memoize(expensiveFunction, { cacheFromContext });
```

## Decorator Support

To enable support for [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) in your TypeScript project:

- The `experimentalDecorators` TypeScript config must be set to `true` in the `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

- Or using the command line option `tsc --experimentalDecorators`

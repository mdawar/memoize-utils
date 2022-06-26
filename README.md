# memoize-utils

[Memoize](https://en.wikipedia.org/wiki/Memoization) sync and async functions (Returning a `Promise`).

Used to cache expensive function calls and return the cached result when the same inputs occur again.

Provides:

- `memoize` Function: Used to memoize any sync or `async` function.
- `memoize` Decorator: **TypeScript** decorator used to memoize class methods and getters.

Can be use to:

- Cache expensive function calls
- Prevent hitting rate limits on an API when the result can be cached
- Speed up programs and prevent unnecessary computations and bandwidth usage

## Installation

```
$ npm i memoize-utils
```

## Usage

Memoizing a function:

```js
import { memoize } from 'memoize-utils';

// Works with sync and async functions
function expensiveFunction() {
  // Some expensive operation that we want to cache its result
  return result;
}

const memoized = memoize(expensiveFunction);

memoized();
memoized(); // Returns cached result
```

Example with cache expiration:

```js
import { memoize } from 'memoize-utils';

async function fetchIP() {
  const response = await fetch('http://httpbin.org/ip');
  return response.json();
}

const memoized = memoize(fetchIP, { maxAge: 2000 }); // Expires after 2 seconds

// The first request is cached
await memoized();

// Subsequent calls return the cached result
await memoized();

// Delay 2 seconds
await new Promise((resolve) => setTimeout(resolve, 2000));

// Cache has expired, make a new request and cache the result
await memoized();
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
    // ...
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

By default a [`Map()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) object is used to store the cached results, any object that implements a similar API can be used instead, for example [`WeakMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap).

```js
const cache = new WeakMap();

const memoized = memoize(expensiveFunction, { cache });

// We can also pass a factory function that returns a cache instance
const memoized = memoize(expensiveFunction, {
  cache: () => new WeakMap(),
});
```

Required `cache` object methods:

- `.set(key, value)`
- `.get(key)`
- `.has(key)`
- `.delete(key)`

## Cache Expiration

Cached results are stored with a timestamp, the `maxAge` option can be passed when creating the memoized function to set the expiration duration of the cache.
The cache expiration is checked when the cache is accessed, so there are no timers that clear the cache automatically, if you need this functionality you can pass a custom `cache` object that supports it.

```js
const memoized = memoize(expensiveFunction, { maxAge: 60 * 60 * 1000 }); // Cache results for 1 hour
```

## Cache ID

By default the first argument of the memoized function is used as the cache ID to store the result.

```js
const memoized = memoize(expensiveFunction);

// All of these 3 calls are considered the same since we're using the first argument as the cache ID
memoized('a');
memoized('a', 'b'); // Cached
memoized('a', 'b', 1); // Cached
```

To use all the arguments as the cache ID, we can pass a `cacheId` function:

```js
function expensiveFunction(a, b, c) {
  // ...
}

const memoized = memoize(expensiveFunction, {
  // The cacheId function accepts the same arguments as the original function
  cacheId: (...args) => args.map(String).join('-'),
});

// In this case, each of these calls is cached separately
memoized('a');
memoized('a', 'b');
memoized('a', 'b', 1);
```

Object arguments require serialization, for example using `JSON.stringify` or any other serialization method.

```js
function expensiveFunction(a = {}, b = null, c = true) {
  // ...
}

const memoized = memoize(expensiveFunction, {
  // Assuming all the arguments are JSON serializable
  cacheId: (...args) => JSON.stringify(args),
});

// Without serialization these calls wouldn't be considered the same
memoized({});
memoized({}); // Cached
memoized({}); // Cached
```

`RegExp` as arguments also must be serialized, for simplicity we can use `RegExp.toString()`.

```js
function expensiveFunction(a) {
  // ...
}

const memoized = memoize(expensiveFunction, {
  cacheId: (a) => a.toString(),
});

// Without serialization these calls wouldn't be considered the same
memoized(/(.*)/);
memoized(/(.*)/); // Cached
memoized(/(.*)/); // Cached
```

## Rejected Promises

By default rejected promises are not cached, this is done to have the same functionality for synchronous functions when throwing errors.
If you want to also cache rejected promises, you can use the `cacheRejectedPromise` option.

```js
// Cache rejected promises
// You might want to use it with `maxAge` so the result expires at some point and the original function call again
const memoized = memoize(expensiveFunction, { cacheRejectedPromise: true });
```

## Cache From Context

If your cache instance requires the original function's context (`this`), you can use `cacheFromContext` function that has access to the same context as the original function and return a cache instance.
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

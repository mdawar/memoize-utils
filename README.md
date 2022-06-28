# memoize-utils

[![npm](https://img.shields.io/npm/v/memoize-utils)](https://www.npmjs.com/package/memoize-utils)

[Memoize](https://en.wikipedia.org/wiki/Memoization) sync and async functions (Returning a `Promise`).

Cache expensive function calls and return the cached result when the same inputs occur again.

This package provides:

- `memoize` Function: Used to memoize any sync or `async` function.
- `memoize` Decorator: **TypeScript** decorator used to memoize class methods and getters.

Can be used to:

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

## Options

| Option                 | Description                                                                                                       | Default     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------- |
| `maxAge`               | Cached results expiration duration in milliseconds (Defaults to no expiration).                                   | `undefined` |
| `cache`                | Custom cache instance or a factory function returning a cache instance.                                           | `new Map()` |
| `cacheId`              | Custom cache ID function, to be used to determine the ID of the cached result (Defaults to first argument as ID). | `undefined` |
| `cacheRejectedPromise` | Cache the rejected promise when memoizing an `async` function.                                                    | `false`     |
| `cacheFromContext`     | Function returning a custom cache instance that has access to the original function's context `this`.             | `undefined` |

To customize these defaults, you can create a wrapper function:

```js
import { memoize as memoizeFn } from 'memoize-utils';

export function memoize(fn, options) {
  const defaults = {
    maxAge: 60 * 60 * 1000, // Cache expires in 1 hour
    cache: new LRUCache(), // Use a custom cache instance
    cacheId: (obj) => obj.id, // Use a specific ID assuming your first arg is an object
    // ...
  };

  return memoizeFn(fn, { defaults, ...options });
}

// Use the new wrapper function
const memoized = memoize(expensiveFunction);
```

## Cache Expiration

Cached results are stored with a timestamp, the `maxAge` option can be passed when creating the memoized function to set the expiration duration of the cache.
The cache expiration is checked when the cache is accessed, so there are no timers that clear the cache automatically, if you need this functionality you can pass a custom `cache` object that supports it.

```js
const memoized = memoize(expensiveFunction, { maxAge: 60 * 60 * 1000 }); // Cache results for 1 hour
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

## Cache ID

By default the **first argument** of the memoized function is used as the cache ID to store the result.

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

### Cache ID Helpers

The module `memoize-utils/helpers` provides some commonly used `cacheId` functions:

- `all`: Get an ID from all the arguments casted to a string and then joined together.
- `json`: Get a JSON string ID from the arguments (`JSON.stringify(args)`).
- `anyOrder`: Get the same ID from a set of arguments passed in any order.

Usage:

```js
import { all, json, anyOrder } from 'memoize-utils/helpers';

// Use all the arguments as an ID
// Note: does not work with objects (Arguments are casted to strings)
// but it works with `RegExp` objects
memoize(fn, { cacheId: all });

// Use all the arguments as an ID including objects
// Note: does not work with `RegExp` objects
memoize(fn, { cacheId: json });

// Use all the arguments as an ID but in any order
// Note: does not work with objects (Arguments are casted to strings)
memoize(fn, { cacheId: anyOrder });
```

You can create your own `memoize` wrapper function using a custom cache ID:

```js
import { memoize } from 'memoize-utils';
import { anyOrder } from 'memoize-utils/helpers';

export function memoizeAnyOrder(fn, options) {
  return memoize(fn, { cacheId: anyOrder, ...options });
}

// Memoize functions using all of the arguments as a cache ID in any order
const memoized = memoizeAnyOrder(fn);
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

The [`moduleResolution`](https://www.typescriptlang.org/tsconfig#moduleResolution) config option must be set to `node16` to be able to import the decorator.

```ts
import { memoize } from 'memoize-utils/decorator';
```

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

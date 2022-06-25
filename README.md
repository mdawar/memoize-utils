# memoize-utils

[Memoize](https://en.wikipedia.org/wiki/Memoization) sync and async functions (Promise returning).

Used to cache expensive function calls and supports cache expiration and custom cache objects.

Provides:

- `memoize`: Used to memoize any sync or `async` function.
- `memoizeDecorator`: Decorator used to memoize class methods and getters.

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
import { memoizeDecorator as memoize } from 'memoize-utils/decorator';

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

## Decorator Support

To enable support for [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) in your TypeScript project:

- The `experimentalDecorators` TypeScript config must be set to `true` in the `tsconfig.json` file:

```
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

- Or using the command line option `tsc --experimentalDecorators`

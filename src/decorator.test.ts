import { memoize } from './decorator.js';

describe('Decorating class properties', () => {
  test('Decorating class property throws an error', () => {
    expect(() => {
      class TestClass {
        // @ts-expect-error Unable to resolve signature of property decorator
        @memoize()
        prop = 10;
      }
    }).toThrow('decorator can only be used');
  });
});

describe('Decorating class method', () => {
  test('Decorating sync class method', () => {
    class TestClass {
      constructor(public index: number) {}

      @memoize()
      count(...args: any[]) {
        return this.index++;
      }
    }

    const a = new TestClass(0);

    expect(a.count()).not.toBeInstanceOf(Promise);
    expect(a.count()).toEqual(0);
    expect(a.count()).toEqual(0);
    expect(a.count('')).toEqual(1);
  });

  test('Decorating async class method', async () => {
    class TestClass {
      constructor(public index: number) {}

      @memoize()
      async count(...args: any[]) {
        return this.index++;
      }
    }

    const a = new TestClass(0);

    expect(a.count()).toBeInstanceOf(Promise);
    expect(await a.count()).toEqual(0);
    expect(await a.count()).toEqual(0);
    expect(await a.count('')).toEqual(1);
  });
});

describe('Decorating class getter', () => {
  test('Decorating sync class getter', () => {
    class TestClass {
      constructor(public index: number) {}

      @memoize()
      get count() {
        return this.index++;
      }
    }

    const a = new TestClass(0);

    expect(a.count).not.toBeInstanceOf(Promise);
    expect(a.count).toEqual(0);
    expect(a.count).toEqual(0);
  });

  test('Decorating async class getter', async () => {
    class TestClass {
      constructor(public index: number) {}

      @memoize()
      get count() {
        return Promise.resolve(this.index++);
      }
    }

    const a = new TestClass(0);

    expect(a.count).toBeInstanceOf(Promise);
    expect(await a.count).toEqual(0);
    expect(await a.count).toEqual(0);
  });
});

describe('Decorator cache instance', () => {
  test('Cache must not be shared accross class instances', async () => {
    class TestClass {
      constructor(public index: number) {}

      @memoize()
      async count() {
        return this.index++;
      }
    }

    const a = new TestClass(0);

    expect(await a.count()).toEqual(0);
    expect(await a.count()).toEqual(0);

    const b = new TestClass(10);

    expect(await b.count()).toEqual(10);
    expect(await b.count()).toEqual(10);

    const c = new TestClass(20);

    expect(await c.count()).toEqual(20);
    expect(await c.count()).toEqual(20);
  });

  test('Each decorated method must have a separate cache', () => {
    class TestClass {
      constructor(public index: number) {}

      @memoize()
      count1() {
        return this.index++;
      }

      @memoize()
      count2() {
        return this.index++;
      }
    }

    const a = new TestClass(0);

    expect(a.count1()).toEqual(0);
    expect(a.count1()).toEqual(0);
    expect(a.count2()).toEqual(1);
    expect(a.count2()).toEqual(1);
  });
});

describe('Custom cache instance', () => {
  test('Using the same cache for all class instances', async () => {
    const cache = new Map();

    class TestClass {
      constructor(public index: number) {}

      // Using the same cache instance
      @memoize({ cache })
      async count() {
        return this.index++;
      }
    }

    const a = new TestClass(0);

    expect(await a.count()).toEqual(0);
    expect(await a.count()).toEqual(0);

    const b = new TestClass(10);

    expect(await b.count()).toEqual(0);
    expect(await b.count()).toEqual(0);

    const c = new TestClass(20);

    expect(await c.count()).toEqual(0);
    expect(await c.count()).toEqual(0);
  });

  test('Using a cache factory creates a cache instance for each class instance', async () => {
    const cacheFactory = () => new Map();

    class TestClass {
      constructor(public index: number) {}

      // Creates a new cache instance for each class instance
      @memoize({ cache: cacheFactory })
      async count() {
        return this.index++;
      }
    }

    const a = new TestClass(0);

    expect(await a.count()).toEqual(0);
    expect(await a.count()).toEqual(0);

    const b = new TestClass(10);

    expect(await b.count()).toEqual(10);
    expect(await b.count()).toEqual(10);

    const c = new TestClass(20);

    expect(await c.count()).toEqual(20);
    expect(await c.count()).toEqual(20);
  });

  test('Using instance property for the cache', () => {
    class TestClass {
      cache: Map<any, any>;

      constructor(public index: number) {
        this.cache = new Map();
      }

      @memoize({
        cacheFromContext(this: any) {
          return this.cache;
        },
      })
      count() {
        return this.index++;
      }
    }

    const a = new TestClass(0);

    expect(a.count()).toEqual(0);
    expect(a.count()).toEqual(0);
    expect(a.cache.size).toEqual(1);

    const b = new TestClass(10);

    expect(b.count()).toEqual(10);
    expect(b.count()).toEqual(10);
    expect(b.cache.size).toEqual(1);

    const c = new TestClass(20);

    expect(c.count()).toEqual(20);
    expect(c.count()).toEqual(20);
    expect(c.cache.size).toEqual(1);
  });
});

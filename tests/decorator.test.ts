import { memoizeDecorator } from '../src/decorator.js';

describe('Decorating class properties', () => {
  test('Decorating class property throws an error', () => {
    expect(() => {
      class TestClass {
        // @ts-expect-error Unable to resolve signature of property decorator
        @memoizeDecorator()
        prop = 10;
      }
    }).toThrow('decorator can only be used');
  });
});

describe('Decorating class method', () => {
  test('Decorating sync class method', () => {
    class TestClass {
      constructor(public index: number) {}

      @memoizeDecorator()
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

      @memoizeDecorator()
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

      @memoizeDecorator()
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

      @memoizeDecorator()
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

      @memoizeDecorator()
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

      @memoizeDecorator()
      count1() {
        return this.index++;
      }

      @memoizeDecorator()
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
      @memoizeDecorator({ cache })
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
      @memoizeDecorator({ cache: cacheFactory })
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
});

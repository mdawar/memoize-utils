import { memoize } from '../src/index.js';

describe('Basic tests', () => {
  test('Memoized function result is cached', () => {
    let index = 0;
    const counter = () => index++;

    const memoized = memoize(counter);

    expect(memoized()).toEqual(0);
    expect(memoized()).toEqual(memoized());
  });
});

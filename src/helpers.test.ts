import { all, json, anyOrder } from './helpers.js';

describe('all (Args to string)', () => {
  test('Without arguments', () => {
    expect(all()).toEqual('');
  });

  test('undefined', () => {
    expect(all(undefined)).toEqual('undefined');
  });

  test('null', () => {
    expect(all(null)).toEqual('null');
  });

  test('Object', () => {
    expect(all({ a: 1, b: true, c: null })).toEqual('[object Object]');
  });

  test('Empty object', () => {
    expect(all({})).toEqual('[object Object]');
  });

  test('Array', () => {
    expect(all(['str', 1, undefined, true, null])).toEqual('str,1,,true,');
  });

  test('Empty array', () => {
    expect(all([])).toEqual('');
  });

  test('RegExp', () => {
    expect(all(/^(.*)?/)).toEqual('/^(.*)?/');
  });

  test('Multiple arguments', () => {
    expect(all('str', 100, null, true, undefined, /^(.*)?/)).toEqual(
      'str-100-null-true-undefined-/^(.*)?/'
    );
  });
});

describe('json (Args to JSON string)', () => {
  test('Without arguments', () => {
    expect(json()).toEqual('[]');
  });

  test('undefined', () => {
    expect(json(undefined)).toEqual('[null]');
  });

  test('null', () => {
    expect(json(null)).toEqual('[null]');
  });

  test('Object', () => {
    expect(json({ a: 1, b: true, c: null })).toEqual('[{"a":1,"b":true,"c":null}]');
  });

  test('Empty object', () => {
    expect(json({})).toEqual('[{}]');
  });

  test('Array', () => {
    expect(json(['str', 1, undefined, true, null])).toEqual('[["str",1,null,true,null]]');
  });

  test('Empty array', () => {
    expect(json([])).toEqual('[[]]');
  });

  test('RegExp', () => {
    expect(json(/^(.*)?/)).toEqual('[{}]');
  });

  test('Multiple arguments', () => {
    expect(json({ a: 1 }, true, undefined, [false, { b: 2 }], /^(.*)?/)).toEqual(
      '[{"a":1},true,null,[false,{"b":2}],{}]'
    );
  });
});

describe('anyOrder (Args in any order to string)', () => {
  test('Without arguments', () => {
    expect(anyOrder()).toEqual('');
  });

  test('Strings', () => {
    expect(anyOrder('a', 'b', 'c', '0', '1')).toEqual(anyOrder('1', 'b', 'a', 'c', '0'));
  });

  test('Numbers', () => {
    expect(anyOrder(1, 2, 3, 4, 100, 1000)).toEqual(anyOrder(100, 2, 1000, 4, 1, 3));
  });

  test('Booleans', () => {
    expect(anyOrder(true, false, true, false)).toEqual(anyOrder(false, false, true, true));
  });

  test('null and undefined', () => {
    expect(anyOrder(null, undefined)).toEqual(anyOrder(undefined, null));
  });

  test('Arrays', () => {
    const arr1 = ['str', 1, undefined, true, null];
    const arr2 = [1, 2, 3, true, null];
    const arr3 = [null, 100];

    expect(anyOrder(arr1, arr2, arr3)).toEqual(anyOrder(arr3, arr1, arr2));
  });

  test('RegExp objects', () => {
    const r1 = /^(.*)?/;
    const r2 = /([A-Z])\w+/;
    const r3 = /(\d+(\.\d+)?)/gi;

    expect(anyOrder(r1, r2, r3)).toEqual(anyOrder(r2, r3, r1));
  });

  test('Multiple arguments', () => {
    const string = 'str';
    const number = 100;
    const regexp = /^(.*)?/;

    expect(anyOrder(string, number, null, true, undefined, regexp, false)).toEqual(
      anyOrder(false, undefined, true, regexp, null, string, number)
    );
  });
});

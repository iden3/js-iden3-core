import { helloWorld } from '../src';

describe('Hello World Function', () => {
  it('should return the hello world message', () => {
    const expected = 'Hello World from my example modern npm package!';
    const actual = helloWorld();
    expect(actual).toEqual(expected);
  });
});

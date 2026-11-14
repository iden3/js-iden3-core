import { describe, expect, it } from 'vitest';
import { fromBigEndian, toBigEndian } from '../src/utils';

describe('utils', () => {
  it('fromBigEndian does not modify its input', () => {
    const bytes = Uint8Array.from([1, 2, 3]);

    expect(fromBigEndian(bytes)).toEqual(0x010203n);
    expect(bytes).toEqual(Uint8Array.from([1, 2, 3]));
    // Converting the same array again gives the same result
    expect(fromBigEndian(bytes)).toEqual(0x010203n);
  });

  it('fromBigEndian is the inverse of toBigEndian', () => {
    const n = 0x0102030405n;

    expect(fromBigEndian(toBigEndian(n))).toEqual(n);
  });
});

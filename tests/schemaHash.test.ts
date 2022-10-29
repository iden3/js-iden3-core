import { SchemaHash } from '../src/schemaHash';
import { Hex } from '../src/hex';
describe('schema hash', () => {
  it('should return the hex value', () => {
    const source = Uint8Array.from([
      82, 253, 252, 7, 33, 130, 101, 79, 22, 63, 95, 15, 154, 98, 29, 114
    ]);
    expect(source.length).toEqual(16);
    const actual = Hex.encode(source);
    const expected = Uint8Array.from([
      53, 50, 102, 100, 102, 99, 48, 55, 50, 49, 56, 50, 54, 53, 52, 102, 49, 54, 51, 102, 53, 102,
      48, 102, 57, 97, 54, 50, 49, 100, 55, 50
    ]);
    expect(expected.length).toEqual(32);
    expect(actual).toEqual(expected);
  });

  it('new schema hash from hex', () => {
    const hash = 'ca938857241db9451ea329256b9c06e5';
    const got = SchemaHash.newSchemaHashFromHex(hash);
    const exp = Hex.decodeString(hash);
    expect(exp).toEqual(got.bytes);
  });

  it('big int check', () => {
    const schema = SchemaHash.newSchemaHashFromHex('ca938857241db9451ea329256b9c06e5');
    const exp = BigInt('304427537360709784173770334266246861770');
    const got = schema.bigInt();
    expect(got).toEqual(exp);
  });
});

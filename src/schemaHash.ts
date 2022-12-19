import { Hex } from '@iden3/js-crypto';
import { Constants } from './constants';
import { BytesHelper } from './elemBytes';

export class SchemaHash {
  // authSchemaHash predefined value of auth schema, used for auth claim during identity creation.
  // This schema is hardcoded in the identity circuits and used to verify user's auth claim.
  // Keccak256(https://schema.iden3.io/core/jsonld/auth.jsonld#AuthBJJCredential) last 16 bytes
  // Hex: cca3371a6cb1b715004407e325bd993c
  // BigInt: 80551937543569765027552589160822318028
  static readonly authSchemaHash = new SchemaHash(
    Uint8Array.from([204, 163, 55, 26, 108, 177, 183, 21, 0, 68, 7, 227, 37, 189, 153, 60])
  );

  private _bytes: Uint8Array = new Uint8Array(Constants.SCHEMA.HASH_LENGTH);
  /**
   * Constructor
   * @param bytes
   */
  constructor(bytes?: Uint8Array) {
    if (bytes) {
      this._bytes = bytes;
    }
    if (this.bytes.length !== Constants.SCHEMA.HASH_LENGTH) {
      throw new Error(`Schema hash must be ${Constants.SCHEMA.HASH_LENGTH} bytes long`);
    }
  }

  get bytes(): Uint8Array {
    return this._bytes;
  }

  /**
   * MarshalText returns HEX representation of SchemaHash.
   * @returns {Uint8Array} 32 bytes//
   */
  marshalTextBytes(): Uint8Array {
    return Hex.encode(this.bytes);
  }

  marshalText(): string {
    return Hex.encodeString(this.bytes);
  }

  /**
   * NewSchemaHashFromHex creates new SchemaHash from hex string
   * @param s
   * @returns {SchemaHash}
   */
  static newSchemaHashFromHex(s: string): SchemaHash {
    const schemaEncodedBytes = Hex.decodeString(s);

    if (schemaEncodedBytes.length !== Constants.SCHEMA.HASH_LENGTH) {
      throw new Error(`invalid schema hash length: ${schemaEncodedBytes.length}`);
    }

    return new SchemaHash(schemaEncodedBytes);
  }

  /**
   * NewSchemaHashFromInt creates new SchemaHash from big.Int
   * @param i
   * @returns
   */
  static newSchemaHashFromInt(i: bigint): SchemaHash {
    const bytes = BytesHelper.intToNBytes(i, Constants.SCHEMA.HASH_LENGTH);
    const start = Constants.SCHEMA.HASH_LENGTH - bytes.length;
    return new SchemaHash(BytesHelper.intToBytes(i).slice(start, Constants.SCHEMA.HASH_LENGTH));
  }

  /**
   * Convert SchemaHash to big.Int
   * @returns {bigint}
   */
  bigInt(): bigint {
    return BytesHelper.bytesToInt(this.bytes);
  }
}

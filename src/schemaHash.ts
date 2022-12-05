import { Hex } from '@iden3/js-crypto';
import { Constants } from './constants';
import { BytesHelper } from './elemBytes';

export class SchemaHash {
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
    return new SchemaHash(BytesHelper.intToBytes(i).slice(-16));
  }

  /**
   * Convert SchemaHash to big.Int
   * @returns {bigint}
   */
  bigInt(): bigint {
    return BytesHelper.bytesToInt(this.bytes);
  }
}

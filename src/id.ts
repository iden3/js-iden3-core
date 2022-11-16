import { Constants } from './constants';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const base58Js = require('base58-js');
import { fromLittleEndian, poseidonHash } from './utils';
import { BytesHelper } from './elemBytes';

// ID is a byte array with
// [  type  | root_genesis | checksum ]
// [2 bytes |   27 bytes   | 2 bytes  ]
// where the root_genesis are the first 28 bytes from the hash root_genesis

export class Id {
  private _bytes: Uint8Array;
  private readonly _checksum: Uint8Array;

  constructor(typ: Uint8Array, genesis: Uint8Array) {
    this._checksum = BytesHelper.calculateChecksum(typ, genesis);
    this._bytes = Uint8Array.from([...typ, ...genesis, ...this._checksum]);
  }

  private static getFromBytes(bytes: Uint8Array): Id {
    const { typ, genesis }: { typ: Uint8Array; genesis: Uint8Array } =
      BytesHelper.decomposeBytes(bytes);
    return new Id(typ, genesis);
  }

  checksum(): Uint8Array {
    return this._checksum;
  }

  string(): string {
    return base58Js.binary_to_base58(this._bytes);
  }

  get bytes(): Uint8Array {
    return this._bytes;
  }

  set bytes(b: Uint8Array) {
    this._bytes = b;
  }

  type(): Uint8Array {
    return this._bytes.slice(0, 2);
  }

  bigInt(): bigint {
    return fromLittleEndian(this._bytes);
  }

  equal(id: Id): boolean {
    return JSON.stringify(this._bytes) === JSON.stringify(id.bytes);
  }

  marshal(): Uint8Array {
    return new TextEncoder().encode(this.string());
  }

  static unMarshal(b: Uint8Array): Id {
    return Id.fromString(new TextDecoder().decode(b));
  }

  static fromBytes(b: Uint8Array): Id {
    const bytes = b ?? Uint8Array.from([]);
    if (bytes.length !== Constants.ID.ID_LENGTH) {
      throw new Error('fromBytes error: byte array incorrect length');
    }

    if (bytes.every((i: number) => i === 0)) {
      throw new Error('fromBytes error: byte array empty');
    }

    const id = Id.getFromBytes(bytes);

    if (!BytesHelper.checkChecksum(bytes)) {
      throw new Error('fromBytes error: checksum error');
    }

    return id;
  }

  static fromString(s: string): Id {
    const bytes = base58Js.base58_to_binary(s);
    return Id.fromBytes(bytes);
  }

  static idFromInt(bigInt: bigint): Id {
    const b = BytesHelper.intToNBytes(bigInt, Constants.ID.ID_LENGTH);
    return Id.fromBytes(b);
  }

  static async profileId(id: Id, nonce: bigint): Promise<Id> {
    const bigIntHash = await poseidonHash([id.bigInt(), nonce]);
    const { typ } = BytesHelper.decomposeBytes(id.bytes);
    const genesis = BytesHelper.intToNBytes(bigIntHash, 27);
    return new Id(typ, genesis);
  }
}

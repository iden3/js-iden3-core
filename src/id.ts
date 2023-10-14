import { Constants } from './constants';
import { fromLittleEndian } from './utils';
import { BytesHelper, ElemBytes } from './elemBytes';
import { poseidon, base58ToBytes, base58FromBytes } from '@iden3/js-crypto';

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
    return base58FromBytes(this._bytes);
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
    const bytes = base58ToBytes(s);
    return Id.fromBytes(bytes);
  }

  static fromBigInt(bigInt: bigint): Id {
    const b = BytesHelper.intToNBytes(bigInt, Constants.ID.ID_LENGTH);
    return Id.fromBytes(b);
  }

  static profileId(id: Id, nonce: bigint): Id {
    const bigIntHash = poseidon.hash([id.bigInt(), nonce]);
    const { typ } = BytesHelper.decomposeBytes(id.bytes);
    const genesis = BytesHelper.intToNBytes(bigIntHash, 27);
    return new Id(typ, genesis);
  }

  // IdGenesisFromIdenState calculates the genesis ID from an Identity State.
  static idGenesisFromIdenState(
    typ: Uint8Array, //nolint:revive
    state: bigint
  ): Id {
    const idenStateData = ElemBytes.fromInt(state);

    // we take last 27 bytes, because of swapped endianness
    const idGenesisBytes = idenStateData.bytes.slice(idenStateData.bytes.length - 27);
    return new Id(typ, idGenesisBytes);
  }

  static ethAddressFromId(id: Id): Uint8Array {
    const isZeros = id.bytes.slice(2, 2 + 7).every((i: number) => i === 0);
    if (!isZeros) {
      throw new Error("can't get Ethereum address: high bytes of genesis are not zero");
    }
    return id.bytes.slice(2 + 7).slice(0, Constants.ETH_ADDRESS_LENGTH);
  }
}

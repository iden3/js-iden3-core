import { Constants } from './constants';
import { sha256 } from 'cross-sha256';
import { checkBigIntInField, fromLittleEndian, toLittleEndian } from './utils';
import { Hex } from '@iden3/js-crypto';
export class BytesHelper {
  static intToBytes(int: bigint): Uint8Array {
    return BytesHelper.intToNBytes(int, Constants.BYTES_LENGTH);
  }

  static intToNBytes(int: bigint, n: number): Uint8Array {
    return Uint8Array.from(toLittleEndian(int, n));
  }

  static checkChecksum(bytes: Uint8Array): boolean {
    const { typ, genesis, checksum } = BytesHelper.decomposeBytes(bytes);
    if (!checksum.length || JSON.stringify(Uint8Array.from([0, 0])) === JSON.stringify(checksum)) {
      return false;
    }

    const c = BytesHelper.calculateChecksum(typ, genesis);
    return JSON.stringify(c) === JSON.stringify(checksum);
  }

  static decomposeBytes(b: Uint8Array): {
    typ: Uint8Array;
    genesis: Uint8Array;
    checksum: Uint8Array;
  } {
    const offset = 2;
    const len = b.length - offset;
    return {
      typ: b.slice(0, offset),
      genesis: b.slice(offset, len),
      checksum: b.slice(-offset)
    };
  }

  static calculateChecksum(typ: Uint8Array, genesis: Uint8Array): Uint8Array {
    const toChecksum = [...typ, ...genesis];
    const s: number = toChecksum.reduce((acc, cur) => acc + cur, 0);
    const checksum = [s >> 8, s & 0xff];
    return Uint8Array.from(checksum.reverse());
  }

  static hashBytes(str: string): Uint8Array {
    const hash = new sha256().update(str).digest();
    return new Uint8Array(hash);
  }

  static hexToBytes(str: string): Uint8Array {
    const buffer = Buffer.from(str, 'hex');
    return Uint8Array.from(buffer);
  }

  static bytesToHex(bytes: Uint8Array) {
    const hex: string[] = [];
    for (let i = 0; i < bytes.length; i++) {
      const current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
      hex.push((current >>> 4).toString(16));
      hex.push((current & 0xf).toString(16));
    }
    return hex.join('');
  }

  static bytesToInt(bytes: Uint8Array): bigint {
    return fromLittleEndian(bytes);
  }
}

export class ElemBytes {
  private _bytes = new Uint8Array(Constants.BYTES_LENGTH);

  constructor(bytes?: Uint8Array | null) {
    if (bytes) {
      this._bytes = bytes;
    }
    if (this._bytes.length !== Constants.BYTES_LENGTH) {
      throw new Error('Invalid bytes length');
    }
  }

  get bytes(): Uint8Array {
    return this._bytes;
  }

  set bytes(value: Uint8Array) {
    this._bytes = value;
  }

  toBigInt(): bigint {
    return BytesHelper.bytesToInt(this._bytes);
  }

  setBigInt(n: bigint): ElemBytes {
    if (!checkBigIntInField(n)) {
      throw new Error(Constants.ERRORS.DATA_OVERFLOW);
    }
    this._bytes = BytesHelper.intToBytes(n);
    return this;
  }

  slotFromHex(hex: string): ElemBytes {
    const bytes = Hex.decodeString(hex);
    if (bytes.length !== Constants.BYTES_LENGTH) {
      throw new Error('Invalid bytes length');
    }
    this._bytes.set(bytes, 0);
    return this;
  }

  hex(): string {
    return Hex.encodeString(this._bytes);
  }

  // ElemBytesToInts converts slice of ElemBytes to slice of *big.Int
  static elemBytesToInts(elements: ElemBytes[]): bigint[] {
    const result: bigint[] = [];

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      result.push(element.toBigInt());
    }

    return result;
  }

  static fromInt(i: bigint): ElemBytes {
    if (!checkBigIntInField(i)) {
      throw new Error(Constants.ERRORS.DATA_OVERFLOW);
    }
    const bytes = BytesHelper.intToBytes(i);
    return new ElemBytes(bytes);
  }
}

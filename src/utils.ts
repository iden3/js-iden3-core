import { Constants } from './constants';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const poseidonLib = require('circomlibjs');

export function fromLittleEndian(bytes: Uint8Array): bigint {
  const n256 = BigInt(256);
  let result = BigInt(0);
  let base = BigInt(1);
  bytes.forEach((byte) => {
    result += base * BigInt(byte);
    base = base * n256;
  });
  return result;
}

export function fromBigEndian(bytes: Uint8Array): bigint {
  return fromLittleEndian(bytes.reverse());
}

export function toLittleEndian(bigNumber: bigint, len = 31): Uint8Array {
  const n256 = BigInt(256);
  const result = new Uint8Array(len);
  let i = 0;
  while (bigNumber > BigInt(0)) {
    result[i] = Number(bigNumber % n256);
    bigNumber = bigNumber / n256;
    i += 1;
  }
  return result;
}

export function toBigEndian(bigNumber: bigint): Uint8Array {
  return toLittleEndian(bigNumber).reverse();
}

export function putUint32(n: number): Uint8Array {
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setUint32(0, n, true);
  return new Uint8Array(buf);
}

export function getUint32(arr: Uint8Array): number {
  const buf = arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
  return new DataView(buf).getUint32(0, true);
}

export function putUint64(n: number): Uint8Array {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setBigUint64(0, BigInt(n), true);
  return new Uint8Array(buf);
}

export function getUint64(arr: Uint8Array): number {
  const buf = arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
  return Number(new DataView(buf).getBigUint64(0, true));
}

export function getUnixTimestamp(d: Date): number {
  return Math.floor(d.getTime() / 1000);
}
export function getDateFromUnixTimestamp(n: number): Date {
  return new Date(n * 1000);
}

// checkBigIntInField checks if given *big.Int fits in a Field Q element
export function checkBigIntInField(a: bigint): boolean {
  return a < Constants.Q;
}

export function checkBigIntArrayInField(arr: bigint[]): boolean {
  return arr.every((n) => checkBigIntInField(n));
}

export async function poseidonHash(input: number[] | bigint[] | Uint8Array): Promise<bigint> {
  const poseidon = await poseidonLib.buildPoseidon();
  return poseidon.F.toObject(poseidon(input));
}

export class Poseidon {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static _poseidon: any;
  static async init(): Promise<void> {
    Poseidon._poseidon = await poseidonLib.buildPoseidon();
  }

  static hash(input: number[] | bigint[] | Uint8Array): bigint {
    return Poseidon._poseidon.F.toObject(Poseidon._poseidon(input));
  }
}

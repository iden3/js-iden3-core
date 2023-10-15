import { poseidon } from '@iden3/js-crypto';
import { Constants } from './constants';
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const encoder = new TextEncoder();

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

export function toBigEndian(bigNumber: bigint, len = 31): Uint8Array {
  return toLittleEndian(bigNumber, len).reverse();
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

export function putUint64(n: bigint): Uint8Array {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setBigUint64(0, n, true);
  return new Uint8Array(buf);
}

export function getUint64(arr: Uint8Array): bigint {
  const buf = arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
  return new DataView(buf).getBigUint64(0, true);
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

// IdenState calculates the Identity State from the Claims Tree Root,
// Revocation Tree Root and Roots Tree Root.
export function idenState(clr: bigint, rer: bigint, ror: bigint): bigint {
  return poseidon.hash([clr, rer, ror]);
}

export class StringUtils {
  static isNotValidIDChar(char: string): boolean {
    return (
      StringUtils.isNotAlpha(char) && StringUtils.isNotDigit(char) && char !== '.' && char !== '-'
    );
  }

  static isNotValidParamChar(char: string): boolean {
    return (
      StringUtils.isNotAlpha(char) &&
      StringUtils.isNotDigit(char) &&
      char !== '.' &&
      char !== '-' &&
      char !== '_' &&
      char !== ':'
    );
  }

  static isNotValidQueryOrFragmentChar(char: string): boolean {
    return StringUtils.isNotValidPathChar(char) && char !== '/' && char !== '?';
  }

  static isNotValidPathChar(char: string): boolean {
    return StringUtils.isNotUnreservedOrSubdelim(char) && char !== ':' && char !== '@';
  }

  static isNotUnreservedOrSubdelim(char: string): boolean {
    switch (char) {
      case '-':
      case '.':
      case '_':
      case '~':
      case '!':
      case '$':
      case '&':
      case "'":
      case '(':
      case ')':
      case '*':
      case '+':
      case ',':
      case ';':
      case '=':
        return false;
      default:
        if (StringUtils.isNotAlpha(char) && StringUtils.isNotDigit(char)) {
          return true;
        }
        return false;
    }
  }

  static isNotHexDigit(char: string): boolean {
    return (
      StringUtils.isNotDigit(char) &&
      (char < '\x41' || char > '\x46') &&
      (char < '\x61' || char > '\x66')
    );
  }

  static isNotDigit(char: string): boolean {
    // '\x30' is digit 0, '\x39' is digit 9
    return char < '\x30' || char > '\x39';
  }

  // StringUtils.isNotAlpha returns true if a byte is not a big letter between A-Z or small letter between a-z
  // https://tools.ietf.org/html/rfc5234#appendix-B.1
  static isNotAlpha(char: string): boolean {
    return StringUtils.isNotSmallLetter(char) && StringUtils.isNotBigLetter(char);
  }

  // isNotBigLetter returns true if a byte is not a big letter between A-Z
  // in US-ASCII http://www.columbia.edu/kermit/ascii.html
  // https://tools.ietf.org/html/rfc5234#appendix-B.1
  static isNotBigLetter(char: string): boolean {
    // '\x41' is big letter A, '\x5A' small letter Z
    return char < '\x41' || char > '\x5A';
  }

  // isNotSmallLetter returns true if a byte is not a small letter between a-z
  // in US-ASCII http://www.columbia.edu/kermit/ascii.html
  // https://tools.ietf.org/html/rfc5234#appendix-B.1
  static isNotSmallLetter(char: string): boolean {
    // '\x61' is small letter a, '\x7A' small letter z
    return char < '\x61' || char > '\x7A';
  }
}

export const genesisFromEthAddress = (addr: Uint8Array) => {
  return Uint8Array.from([...new Uint8Array(7), ...addr]);
};

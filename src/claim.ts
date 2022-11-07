import { SchemaHash } from './schemaHash';
import { ElemBytes } from './elemBytes';
import { Constants } from './constants';
import { Id } from './id';
import {
  checkBigIntArrayInField,
  checkBigIntInField,
  getDateFromUnixTimestamp,
  getUint32,
  getUint64,
  getUnixTimestamp,
  poseidonHash,
  putUint32,
  putUint64 as getBytesFromUint64
} from './utils';

/*
Claim structure

Index:
 i_0: [ 128  bits ] claim schema
      [ 32 bits ] option flags
          [3] Subject:
            000: A.1 Self
            001: invalid
            010: A.2.i OtherIden Index
            011: A.2.v OtherIden Value
            100: B.i Object Index
            101: B.v Object Value
          [1] Expiration: bool
          [1] Updatable: bool
          [3] Merklized:
            000: none
            001: C.i Root Index (root located in i_2)
            010: C.v Root Value (root located in v_2)
          [24] 0
      [ 32 bits ] version (optional?)
      [ 61 bits ] 0 - reserved for future use
 i_1: [ 248 bits] identity (case b) (optional)
      [  5 bits ] 0
 i_2: [ 253 bits] 0
 i_3: [ 253 bits] 0
Value:
 v_0: [ 64 bits ]  revocation nonce
      [ 64 bits ]  expiration date (optional)
      [ 125 bits] 0 - reserved
 v_1: [ 248 bits] identity (case c) (optional)
      [  5 bits ] 0
 v_2: [ 253 bits] 0
 v_3: [ 253 bits] 0
*/

// Option provides the ability to set different Claim's fields on construction
export type Option = (c: Claim) => void;

// WithFlagUpdatable sets claim's flag `updatable`
export function withFlagUpdatable(val: boolean): Option {
  return (c: Claim) => c.setFlagUpdatable(val);
}

// WithVersion sets claim's version
export function withVersion(ver: number): Option {
  return (c: Claim) => c.setVersion(ver);
}

// WithIndexId sets Id to claim's index
export function withIndexId(id: Id): Option {
  return (c: Claim) => c.setIndexId(id);
}

// WithValueId sets Id to claim's value
export function withValueId(id: Id): Option {
  return (c: Claim) => c.setValueId(id);
}

// WithFlagMerklize sets claim's flag `merklize`
export function withFlagMerklize(p: MerklizePosition): Option {
  return (c: Claim) => c.setFlagMerklize(p);
}

// WithId sets Id to claim's index or value depending on `pos`.
export function withId(id: Id, pos: IdPosition): Option {
  return (c: Claim) => {
    switch (pos) {
      case IdPosition.Index:
        c.setIndexId(id);
        break;
      case IdPosition.Value:
        c.setValueId(id);
        break;
      default:
        throw new Error(Constants.ERRORS.INCORRECT_ID_POSITION);
    }
  };
}

// WithRevocationNonce sets claim's revocation nonce.
export function withRevocationNonce(nonce: number): Option {
  return (c: Claim) => c.setRevocationNonce(nonce);
}

// WithExpirationDate sets claim's expiration date to `dt`.
export function withExpirationDate(dt: Date): Option {
  return (c: Claim) => c.setExpirationDate(dt);
}

// WithIndexData sets data to index slots A & B.
// Returns ErrSlotOverflow if slotA or slotB value are too big.
export function withIndexData(slotA: ElemBytes, slotB: ElemBytes): Option {
  return (c: Claim) => c.setIndexData(slotA, slotB);
}

// WithIndexDataBytes sets data to index slots A & B.
// Returns ErrSlotOverflow if slotA or slotB value are too big.
export function withIndexDataBytes(slotA: Uint8Array | null, slotB: Uint8Array | null): Option {
  return (c: Claim) => c.setIndexDataBytes(slotA, slotB);
}

// WithIndexDataInts sets data to index slots A & B.
// Returns ErrSlotOverflow if slotA or slotB value are too big.
export function withIndexDataInts(slotA: bigint | null, slotB: bigint | null): Option {
  return (c: Claim) => c.setIndexDataInts(slotA, slotB);
}

// WithValueData sets data to value slots A & B.
// Returns ErrSlotOverflow if slotA or slotB value are too big.
export function withValueData(slotA: ElemBytes, slotB: ElemBytes): Option {
  return (c: Claim) => c.setValueData(slotA, slotB);
}

// WithValueDataBytes sets data to value slots A & B.
// Returns ErrSlotOverflow if slotA or slotB value are too big.
export function withValueDataBytes(slotA: Uint8Array, slotB: Uint8Array): Option {
  return (c: Claim) => c.setValueDataBytes(slotA, slotB);
}

// WithValueDataInts sets data to value slots A & B.
// Returns ErrSlotOverflow if slotA or slotB value are too big.
export function withValueDataInts(slotA: bigint | null, slotB: bigint | null): Option {
  return (c: Claim) => c.setValueDataInts(slotA, slotB);
}

// NewClaim creates new Claim with specified SchemaHash and any number of
// options. Using options you can specify any field in claim.
export function newClaim(sh: SchemaHash, ...args: Option[]): Claim {
  const c = new Claim();
  c.setSchemaHash(sh);
  for (let i = 0; i < args.length; i++) {
    const fn = args[i];
    fn(c);
  }
  return c;
}

export enum SlotName {
  IndexA = 'IndexA',
  IndexB = 'IndexB',
  ValueA = 'ValueA',
  ValueB = 'ValueB'
}

// ErrSlotOverflow means some ElemBytes overflows Q Field. And wraps the name
// of overflowed slot.
export class ErrSlotOverflow extends Error {
  constructor(msg: string) {
    super(`Slot ${msg} not in field (too large)`);
    Object.setPrototypeOf(this, ErrSlotOverflow.prototype);
  }
}

// subjectFlag for the time being describes the location of Id (in index or value
// slots or nowhere at all).
//
// Values subjectFlagInvalid presents for backward compatibility and for now means nothing.

export enum SubjectFlag {
  Self = 0b0,
  Invalid = 0b1,
  OtherIdenIndex = 0b10,
  OtherIdenValue = 0b11
}

export enum IdPosition {
  None = 0,
  Index = 1,
  Value = 2
}

// merklizeFlag for the time being describes the location of root (in index or value
// slots or nowhere at all).
//
// Values merklizeFlagIndex indicates that root is located in index[2] slots.
// Values merklizeFlagValue indicates that root is located in value[2] slots.
export enum MerklizeFlag {
  None = 0b00000000,
  Index = 0b00100000,
  Value = 0b01000000,
  Invalid = 0b10000000
}

export enum MerklizePosition {
  None = 0,
  Index = 1,
  Value = 2
}

export enum Flags {
  ByteIdx = 16,
  ExpirationBitIdx = 3,
  UpdatableBitIdx = 4
}

export class Claim {
  private _index: ElemBytes[] = [];
  private _value: ElemBytes[] = [];

  constructor() {
    for (let i = 0; i < Constants.ELEM_BYTES_LENGTH; i++) {
      this._index[i] = new ElemBytes();
      this._value[i] = new ElemBytes();
    }
  }

  // GetSchemaHash return copy of claim's schema hash.
  getSchemaHash(): SchemaHash {
    return new SchemaHash(this._index[0].bytes.slice(0, Constants.SCHEMA.HASH_LENGTH));
  }

  get value(): ElemBytes[] {
    return this._value;
  }

  set value(value: ElemBytes[]) {
    this._value = value;
  }

  get index(): ElemBytes[] {
    return this._index;
  }

  set index(value: ElemBytes[]) {
    this._index = value;
  }

  // SetSchemaHash updates claim's schema hash.
  setSchemaHash(sh: SchemaHash) {
    this._index[0] = new ElemBytes(
      Uint8Array.from([...sh.bytes, ...new Array(Constants.SCHEMA.HASH_LENGTH).fill(0)])
    );
  }

  setSubject(s: SubjectFlag) {
    // clean first 3 bits
    this._index[0].bytes[Flags.ByteIdx] &= 0b11111000;
    this._index[0].bytes[Flags.ByteIdx] |= s;
  }

  private getSubject(): SubjectFlag {
    let sbj = this._index[0].bytes[Flags.ByteIdx];
    // clean all except first 3 bits
    sbj &= 0b00000111;
    return sbj as SubjectFlag;
  }

  private setFlagExpiration(val: boolean) {
    if (val) {
      this._index[0].bytes[Flags.ByteIdx] |= 0b1 << Flags.ExpirationBitIdx;
    } else {
      this._index[0].bytes[Flags.ByteIdx] &= ~(0b1 << Flags.ExpirationBitIdx);
    }
  }

  private getFlagExpiration(): boolean {
    const mask = 0b1 << Flags.ExpirationBitIdx;
    return (this._index[0].bytes[Flags.ByteIdx] & mask) > 0;
  }

  // GetIDPosition returns the position at which the Id is stored.
  getIdPosition(): IdPosition {
    switch (this.getSubject()) {
      case SubjectFlag.Self:
        return IdPosition.None;
      case SubjectFlag.OtherIdenIndex:
        return IdPosition.Index;
      case SubjectFlag.OtherIdenValue:
        return IdPosition.Value;
      default:
        throw new Error(Constants.ERRORS.INVALID_SUBJECT_POSITION);
    }
  }

  // SetValueDataInts sets data to value slots A & B.
  // Returns ErrSlotOverflow if slotA or slotB value are too big.
  setValueDataInts(slotA: bigint | null, slotB: bigint | null): void {
    this.setSlotInt(this._value[2], slotA, SlotName.ValueA);
    this.setSlotInt(this._value[3], slotB, SlotName.ValueB);
  }
  // SetValueDataBytes sets data to value slots A & B.
  // Returns ErrSlotOverflow if slotA or slotB value are too big.
  setValueDataBytes(slotA: Uint8Array, slotB: Uint8Array): void {
    this.setSlotBytes(this._value[2], slotA, SlotName.ValueA);
    this.setSlotBytes(this._value[3], slotB, SlotName.ValueB);
  }
  // SetValueData sets data to value slots A & B.
  // Returns ErrSlotOverflow if slotA or slotB value are too big.
  setValueData(slotA: ElemBytes, slotB: ElemBytes): void {
    const slotsAsInts: bigint[] = [slotA.toBigInt(), slotB.toBigInt()];
    if (!checkBigIntArrayInField(slotsAsInts)) {
      throw new Error(Constants.ERRORS.DATA_OVERFLOW);
    }
    this._value[2] = slotA;
    this._value[3] = slotB;
  }
  // SetIndexDataInts sets data to index slots A & B.
  // Returns ErrSlotOverflow if slotA or slotB value are too big.
  setIndexDataInts(slotA: bigint | null, slotB: bigint | null): void {
    this.setSlotInt(this._index[2], slotA, SlotName.IndexA);
    this.setSlotInt(this._index[3], slotB, SlotName.IndexB);
  }
  // SetIndexDataBytes sets data to index slots A & B.
  // Returns ErrSlotOverflow if slotA or slotB value are too big.
  setIndexDataBytes(slotA: Uint8Array | null, slotB: Uint8Array | null): void {
    this.setSlotBytes(this._index[2], slotA, SlotName.IndexA);
    this.setSlotBytes(this._index[3], slotB, SlotName.IndexB);
  }

  private setSlotBytes(slot: ElemBytes, value: Uint8Array | null, slotName: SlotName) {
    slot = new ElemBytes(value);
    if (!checkBigIntInField(slot.toBigInt())) {
      throw new ErrSlotOverflow(slotName);
    }
  }

  setFlagMerklize(s: MerklizePosition): void {
    let f: number;
    switch (s) {
      case MerklizePosition.Index:
        f = MerklizeFlag.Index;
        break;
      case MerklizePosition.Value:
        f = MerklizeFlag.Value;
        break;
      default:
        f = MerklizeFlag.None;
    }
    // clean last 3 bits
    this.index[0].bytes[Flags.ByteIdx] &= 0b00011111;
    this.index[0].bytes[Flags.ByteIdx] |= f;
  }

  private getMerklize(): MerklizeFlag {
    let mt = this.index[0].bytes[Flags.ByteIdx];
    // clean all except last 3 bits
    mt &= 0b11100000;
    return mt as MerklizeFlag;
  }

  // GetMerklizePosition returns the position at which the Merklize flag is stored.
  getMerklizePosition(): MerklizePosition {
    switch (this.getMerklize()) {
      case MerklizeFlag.None:
        return MerklizePosition.None;
      case MerklizeFlag.Index:
        return MerklizePosition.Index;
      case MerklizeFlag.Value:
        return MerklizePosition.Value;
      default:
        throw new Error(Constants.ERRORS.INCORRECT_MERKLIZE_POSITION);
    }
  }

  private setSlotInt(slot: ElemBytes, value: bigint | null, slotName: SlotName) {
    if (!value) {
      value = BigInt(0);
    }
    if (!checkBigIntInField(value)) {
      throw new ErrSlotOverflow(slotName);
    }
    slot.setBigInt(value);
  }
  // SetIndexData sets data to index slots A & B.
  // Returns ErrSlotOverflow if slotA or slotB value are too big.
  setIndexData(slotA: ElemBytes, slotB: ElemBytes) {
    const slotsAsInts: bigint[] = [slotA.toBigInt(), slotB.toBigInt()];
    if (!checkBigIntArrayInField(slotsAsInts)) {
      throw new Error(Constants.ERRORS.DATA_OVERFLOW);
    }
    this._index[2] = slotA;
    this._index[3] = slotB;
  }

  resetExpirationDate(): void {
    this.setFlagExpiration(false);
    const bytes = Array.from({ length: Constants.NONCE_BYTES_LENGTH }, () => 0);
    const arr = Array.from(this._value[0].bytes);
    arr.splice(Constants.NONCE_BYTES_LENGTH, Constants.NONCE_BYTES_LENGTH, ...bytes);
    this._value[0] = new ElemBytes(Uint8Array.from(arr));
  }

  // GetExpirationDate returns expiration date and flag. Flag is true if
  // expiration date is present, false if null.
  getExpirationDate(): Date | null {
    if (this.getFlagExpiration()) {
      const unixTimestamp = getUint64(this._value[0].bytes.slice(8, 16));
      return getDateFromUnixTimestamp(unixTimestamp);
    }
    return null;
  }

  // SetExpirationDate sets expiration date to dt
  setExpirationDate(dt: Date) {
    this.setFlagExpiration(true);
    const bytes = getBytesFromUint64(getUnixTimestamp(dt));
    const arr = Array.from(this._value[0].bytes);
    arr.splice(Constants.NONCE_BYTES_LENGTH, Constants.NONCE_BYTES_LENGTH, ...bytes);
    this._value[0] = new ElemBytes(Uint8Array.from(arr));
  }

  // GetRevocationNonce returns revocation nonce
  getRevocationNonce(): number {
    return getUint64(this._value[0].bytes.slice(0, 8));
  }
  // SetRevocationNonce sets claim's revocation nonce
  setRevocationNonce(nonce: number): void {
    const bytes = getBytesFromUint64(nonce);
    if (bytes.length > Constants.NONCE_BYTES_LENGTH) {
      throw new Error('Nonce length is not valid');
    }
    const arr = Array.from(this._value[0].bytes);
    arr.splice(0, Constants.NONCE_BYTES_LENGTH, ...bytes);
    this._value[0] = new ElemBytes(Uint8Array.from(arr));
  }

  getValueId(): Id {
    return Id.fromBytes(this._value[1].bytes);
  }

  // SetValueId sets id to value. Removes id from index if any.
  setValueId(id: Id): void {
    this.resetIndexId();
    this.setSubject(SubjectFlag.OtherIdenValue);
    const arr = Array.from(this._index[1].bytes);
    arr.splice(0, id.bytes.length, ...id.bytes);
    this._value[1] = new ElemBytes(Uint8Array.from(arr));
  }

  private resetIndexId() {
    this._index[1] = new ElemBytes(new Uint8Array(Constants.BYTES_LENGTH).fill(0));
  }

  private resetValueId(): void {
    this._value[1] = new ElemBytes(new Uint8Array(Constants.BYTES_LENGTH).fill(0));
  }

  getIndexId(): Id {
    return Id.fromBytes(this._index[1].bytes);
  }

  // SetIndexId sets id to index. Removes id from value if any.
  setIndexId(id: Id): void {
    this.resetValueId();
    this.setSubject(SubjectFlag.OtherIdenIndex);
    const arr = Array.from(this._index[1].bytes);
    arr.splice(0, id.bytes.length, ...id.bytes);
    this._index[1] = new ElemBytes(Uint8Array.from(arr));
  }
  // SetVersion sets claim's version
  setVersion(ver: number) {
    const bytes = putUint32(ver);
    this._index[0].bytes[20] = bytes[0];
    this._index[0].bytes[21] = bytes[1];
    this._index[0].bytes[22] = bytes[2];
    this._index[0].bytes[23] = bytes[3];
  }
  // GetVersion returns claim's version
  getVersion(): number {
    return getUint32(this._index[0].bytes.slice(20, 24));
  }
  // SetFlagUpdatable sets claim's flag `updatable`
  setFlagUpdatable(val: boolean) {
    if (val) {
      this._index[0].bytes[Flags.ByteIdx] |= 0b1 << Flags.UpdatableBitIdx;
    } else {
      this._index[0].bytes[Flags.ByteIdx] &= ~(0b1 << Flags.UpdatableBitIdx);
    }
  }

  // HIndex calculates the hash of the Index of the Claim
  async hIndex(): Promise<bigint> {
    return await poseidonHash(ElemBytes.elemBytesToInts(this._index));
  }

  // GetFlagUpdatable returns claim's flag `updatable`
  getFlagUpdatable(): boolean {
    const mask = 0b1 << Flags.UpdatableBitIdx;
    return (this._index[0].bytes[Flags.ByteIdx] & mask) > 0;
  }

  // HValue calculates the hash of the Value of the Claim
  async hValue(): Promise<bigint> {
    return await poseidonHash(ElemBytes.elemBytesToInts(this._value));
  }

  // HiHv returns the HIndex and HValue of the Claim
  async hiHv(): Promise<{ hi: bigint; hv: bigint }> {
    return { hi: await this.hIndex(), hv: await this.hValue() };
  }

  // resetId deletes Id from index and from value.
  resetId(): void {
    this.resetIndexId();
    this.resetValueId();
    this.setSubject(SubjectFlag.Self);
  }
  // GetId returns Id from claim's index of value.
  // Returns error ErrNoId if Id is not set.
  getId(): Id {
    switch (this.getSubject()) {
      case SubjectFlag.OtherIdenIndex:
        return this.getIndexId();
      case SubjectFlag.OtherIdenValue:
        return this.getValueId();
      default:
        throw new Error(Constants.ERRORS.NO_ID);
    }
  }
  // RawSlots returns raw bytes of claim's index and value
  rawSlots(): { index: ElemBytes[]; value: ElemBytes[] } {
    return {
      index: this._index,
      value: this._value
    };
  }
  // RawSlotsAsInts returns slots as []bigint
  rawSlotsAsInts(): bigint[] {
    return [...ElemBytes.elemBytesToInts(this._index), ...ElemBytes.elemBytesToInts(this._value)];
  }

  clone(): Claim {
    return JSON.parse(JSON.stringify(this));
  }

  marshalJson(): string {
    return JSON.stringify(this.rawSlotsAsInts().map((b) => b.toString()));
  }

  unMarshalJson(b: string): Claim {
    const ints: bigint[] = JSON.parse(b).map((s: string) => BigInt(s));

    if (ints.length !== this._index.length + this._value.length) {
      throw new Error("invalid number of claim's slots");
    }
    this._index = [];
    this._value = [];
    for (let i = 0, j = Constants.ELEM_BYTES_LENGTH; i < ints.length / 2; i++, j++) {
      this._index[i] = new ElemBytes();
      this._index[i].setBigInt(ints[i]);
      this._value[i] = new ElemBytes();
      this._value[i].setBigInt(ints[j]);
    }
    return this;
  }

  marshalBinary(): Uint8Array {
    const getBytes = (src: ElemBytes[]) =>
      src.reduce((acc: number[], cur: ElemBytes) => {
        return [...acc, ...cur.bytes];
      }, []);
    return Uint8Array.from(getBytes(this._index).concat(getBytes(this._value)));
  }

  unMarshalBinary(data: Uint8Array): void {
    const wantLen = 2 * Constants.ELEM_BYTES_LENGTH * Constants.BYTES_LENGTH;
    if (data.length !== wantLen) {
      throw new Error('unexpected length of input data');
    }
    this._index = [];
    this._value = [];
    for (let i = 0, j = Constants.ELEM_BYTES_LENGTH; i < Constants.ELEM_BYTES_LENGTH; i++, j++) {
      this._index[i] = new ElemBytes(
        data.slice(i * Constants.BYTES_LENGTH, (i + 1) * Constants.BYTES_LENGTH)
      );
      this._value[i] = new ElemBytes(
        data.slice(j * Constants.BYTES_LENGTH, (j + 1) * Constants.BYTES_LENGTH)
      );
    }
  }
}

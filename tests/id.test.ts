import { Constants } from './../src/constants';
import { Id } from '../src/id';
import { Blockchain, buildDIDType, DidMethod, NetworkId } from '../src/did';
import { BytesHelper } from '../src/elemBytes';
import { Hex } from '@iden3/js-crypto';
describe('id tests', () => {
  it('id parses', () => {
    // Generate ID0
    const typ0 = Hex.decodeString('0000').slice(0, 2);
    const genesis0 = BytesHelper.hashBytes('genesistest').slice(0, 27);
    const id0 = new Id(typ0, genesis0);
    // Check ID0
    expect('114vgnnCupQMX4wqUBjg5kUya3zMXfPmKc9HNH4m2E').toEqual(id0.string());
    // Generate ID1
    const typ1 = Hex.decodeString('0001').slice(0, 2);
    const genesis1 = BytesHelper.hashBytes('genesistest').slice(0, 27);
    const id1 = new Id(typ1, genesis1);
    // Check ID1
    expect('1GYjyJKqdDyzo927FqJkAdLWB64kV2NVAjaQFHtq4').toEqual(id1.string());

    const emptyChecksum = [0x00, 0x00];
    expect(id0.bytes.slice(-2)).not.toEqual(emptyChecksum);

    const id0FromBytes = Id.fromBytes(id0.bytes);
    expect(id0.bytes).toEqual(id0FromBytes.bytes);
    expect(id0.string()).toEqual(id0FromBytes.string());
    expect('114vgnnCupQMX4wqUBjg5kUya3zMXfPmKc9HNH4m2E').toEqual(id0FromBytes.string());

    const id1FromBytes = Id.fromBytes(id1.bytes);
    expect(id1.bytes).toEqual(id1FromBytes.bytes);
    expect(id1.string()).toEqual(id1FromBytes.string());
    expect('1GYjyJKqdDyzo927FqJkAdLWB64kV2NVAjaQFHtq4').toEqual(id1FromBytes.string());

    const id0FromString = Id.fromString(id0.string());
    expect(id0.bytes).toEqual(id0FromString.bytes);
    expect(id0.string()).toEqual(id0FromString.string());
    expect('114vgnnCupQMX4wqUBjg5kUya3zMXfPmKc9HNH4m2E').toEqual(id0FromString.string());

    const id0FromBigInt = Id.fromBigInt(id0.bigInt());
    expect(id1.bytes).toEqual(id1FromBytes.bytes);
    expect(id1.string()).toEqual(id1FromBytes.string());
    expect('1GYjyJKqdDyzo927FqJkAdLWB64kV2NVAjaQFHtq4').toEqual(id1FromBytes.string());

    const id1FromBigInt = Id.fromBigInt(id1.bigInt());
    expect(id1.bytes).toEqual(id1FromBytes.bytes);
    expect(id1.string()).toEqual(id1FromBytes.string());
    expect('1GYjyJKqdDyzo927FqJkAdLWB64kV2NVAjaQFHtq4').toEqual(id1FromBytes.string());
  });

  it('marshal/unmarshal', () => {
    const id = Id.fromString('11AVZrKNJVqDJoyKrdyaAgEynyBEjksV5z2NjZogFv');
    const idj = id.marshal();
    expect('11AVZrKNJVqDJoyKrdyaAgEynyBEjksV5z2NjZogFv').toEqual(Id.unMarshal(idj).string());
    const idp = Id.unMarshal(idj);
    expect(id).toEqual(idp);
  });

  it('Id as DID', () => {
    const typ = buildDIDType(DidMethod.Iden3, Blockchain.Polygon, NetworkId.Mumbai);
    const genesis1 = BytesHelper.hashBytes('genesistes1t2').slice(0, 27);
    const id = new Id(typ, genesis1);
    expect(() => id).not.toThrow();
  });

  it('id checksum', () => {
    const typ = Constants.ID.TYPE_DEFAULT;
    const genesis = BytesHelper.hashBytes('genesistest').slice(0, 27);
    let id = new Id(typ, genesis);

    const checksum = id.checksum();
    expect(BytesHelper.calculateChecksum(typ, genesis)).toEqual(checksum);
    expect(BytesHelper.checkChecksum(id.bytes)).toBeTruthy();

    // check that if we change the checksum, returns false on CheckChecksum
    id = new Id(typ, genesis);
    id.bytes = Uint8Array.from([...id.bytes.slice(0, 29), ...[0x00, 0x01]]);
    expect(BytesHelper.checkChecksum(id.bytes)).toBeFalsy();

    // check that if we change the type, returns false on CheckChecksum
    id = new Id(typ, genesis);
    id.bytes = Uint8Array.from([...[0x00, 0x01], ...id.bytes.slice(-29)]);
    expect(BytesHelper.checkChecksum(id.bytes)).toBeFalsy();

    // check that if we change the genesis, returns false on CheckChecksum
    id = new Id(typ, genesis);
    const changedGenesis = BytesHelper.hashBytes('changedgenesis').slice(0, 27);
    id.bytes = Uint8Array.from([...id.bytes.slice(0, 2), ...changedGenesis, ...id.bytes.slice(-2)]);
    expect(BytesHelper.checkChecksum(id.bytes)).toBeFalsy();

    // test with a empty id
    const empty = new Uint8Array(31);
    expect(() => Id.fromBytes(empty)).toThrow(new Error('fromBytes error: byte array empty'));
  });
});

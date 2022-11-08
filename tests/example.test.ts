import { Hex } from './../src/hex';
import { ElemBytes } from './../src/elemBytes';
import { ClaimOptions, Claim } from '../src/claim';
import { SchemaHash } from '../src/schemaHash';
import { poseidonHash } from '../src/utils';
describe('example new claim', () => {
  it('new claim', async () => {
    const schemaHash = new SchemaHash();
    const expDate = new Date(Date.UTC(2021, 0, 10, 20, 30, 0, 0));
    const claim = Claim.newClaim(
      schemaHash,
      ClaimOptions.withExpirationDate(expDate),
      ClaimOptions.withVersion(42)
    );
    const expDateRes = claim.getExpirationDate();
    expect(expDateRes).toEqual(expDate);
    expect(claim.getVersion()).toEqual(42);
    const { index, value } = claim.rawSlots();

    const indexHash = await poseidonHash(ElemBytes.elemBytesToInts(index));

    const valueHash = await poseidonHash(ElemBytes.elemBytesToInts(value));

    const indexSlot = ElemBytes.fromInt(indexHash);

    const valueSlot = ElemBytes.fromInt(valueHash);

    expect(Hex.encodeString(indexSlot.bytes)).toEqual(
      'a07b32a81b631544f9199f4bf429ad2026baec31ba5e5e707a49cc2c9d243f18'
    );

    expect(Hex.encodeString(valueSlot.bytes)).toEqual(
      '8e6bca4b559d758eca7b6125faea23ed0765cdcb6f85b3fe9477ca4293a6fd05'
    );
  });
});

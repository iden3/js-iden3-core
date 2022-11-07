import {
  Flags,
  IdPosition,
  MerklizeFlag,
  MerklizePosition,
  SubjectFlag,
  withFlagMerklize
} from './../src/claim';
import { BytesHelper, ElemBytes } from './../src/elemBytes';
import {
  Claim,
  newClaim,
  withExpirationDate,
  withFlagUpdatable,
  withIndexData,
  withIndexDataBytes,
  withIndexDataInts,
  withRevocationNonce,
  withValueData,
  withValueDataInts,
  withVersion
} from '../src/claim';
import { SchemaHash } from '../src/schemaHash';
import { poseidonHash } from '../src/utils';
import { Hex } from '../src/hex';
import { Constants } from '../src/constants';
import { Id } from '../src/id';
describe('claim test', () => {
  it('new claim', () => {
    const claim = newClaim(new SchemaHash(), withFlagUpdatable(true));
    expect(claim.value.length).toEqual(4);
    for (let i = 1; i < 4; i++) {
      expect(claim.index[i].bytes.every((b) => b === 0)).toBeTruthy();
    }
    for (let i = 0; i < 32; i++) {
      if (i === 16) {
        expect(claim.index[0].bytes[i]).toEqual(0b10000);
      } else {
        expect(claim.index[0].bytes[i]).toEqual(0);
      }
    }

    const dt = claim.getExpirationDate();
    expect(dt).toBeNull();
  });

  it('raw slots', async () => {
    const claim = newClaim(new SchemaHash(), withFlagUpdatable(true));
    const { index, value } = claim.rawSlots();
    const indexHash = await poseidonHash([
      index[0].toBigInt(),
      index[1].toBigInt(),
      index[2].toBigInt(),
      index[3].toBigInt()
    ]);
    const valueHash = await poseidonHash([
      value[0].toBigInt(),
      value[1].toBigInt(),
      value[2].toBigInt(),
      value[3].toBigInt()
    ]);

    expect('19905260441950906049955646784794273651462264973332746773406911374272567544299').toEqual(
      indexHash.toString()
    );

    expect('2351654555892372227640888372176282444150254868378439619268573230312091195718').toEqual(
      valueHash.toString()
    );
  });

  it('getSchemaHash', async () => {
    const sc = new SchemaHash(
      Uint8Array.from(Array.from({ length: 16 }, () => Math.floor(Math.random() * 16)))
    );
    expect(sc.bytes.length).toEqual(16);
    const claim = newClaim(sc);
    expect(sc.bytes).toEqual(claim.index[0].bytes.slice(0, sc.bytes.length));
    const shFromClaim = claim.getSchemaHash();
    const shFromClaimHexBytes = shFromClaim.marshalText();
    expect(Hex.encodeString(sc.bytes)).toEqual(shFromClaimHexBytes);
  });

  it('getFlagUpdatable', async () => {
    const sc = new SchemaHash();
    let claim = newClaim(sc);
    expect(claim.getFlagUpdatable()).toBeFalsy();

    claim.setFlagUpdatable(true);
    expect(claim.getFlagUpdatable()).toBeTruthy();

    claim.setFlagUpdatable(false);
    expect(claim.getFlagUpdatable()).toBeFalsy();

    claim = newClaim(sc, withFlagUpdatable(true));
    expect(claim.getFlagUpdatable()).toBeTruthy();

    claim = newClaim(sc, withFlagUpdatable(false));
    expect(claim.getFlagUpdatable()).toBeFalsy();
  });

  it('getVersion', async () => {
    const sc = new SchemaHash();
    const maxUint32 = Math.pow(2, 32) - 1;
    const claim = newClaim(sc, withVersion(maxUint32));
    expect(maxUint32).toEqual(claim.getVersion());
    const randomInt = Math.floor(Math.random() * maxUint32);
    claim.setVersion(randomInt);
    expect(randomInt).toEqual(claim.getVersion());
  });

  it('getRevocationNonce', () => {
    const sc = new SchemaHash();
    const nonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    const claim = newClaim(sc, withRevocationNonce(nonce));
    expect(nonce).toEqual(claim.getRevocationNonce());
    const nonce2 = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    claim.setRevocationNonce(nonce2);
    expect(nonce2).toEqual(claim.getRevocationNonce());
  });

  it('expirationDate', () => {
    const sh = new SchemaHash();
    const expDate = new Date();
    expDate.setSeconds(0, 0);
    const c1 = newClaim(sh, withExpirationDate(expDate));

    let expDate2 = c1.getExpirationDate();
    expect(expDate2).not.toBeNull();
    expect(expDate2?.getTime()).toEqual(expDate.getTime());

    c1.resetExpirationDate();
    expDate2 = c1.getExpirationDate();
    expect(expDate2).toBeNull();

    const expDate3 = new Date(expDate);
    expDate3.setSeconds(expDate3.getSeconds() + 10);
    expDate2 = c1.getExpirationDate();
    c1.setExpirationDate(expDate3);
    expDate2 = c1.getExpirationDate();
    expect(expDate2?.getTime()).toEqual(expDate3.getTime());
  });

  it('test int size', () => {
    const iX = BigInt(
      '16243864111864693853212588481963275789994876191154110553066821559749894481761'
    );
    const iY = BigInt(
      '7078462697308959301666117070269719819629678436794910510259518359026273676830'
    );
    const vX = BigInt(
      '12448278679517811784508557734102986855579744384337338465055621486538311281772'
    );
    const vY = BigInt(
      '9260608685281348956030279125705000716237952776955782848598673606545494194823'
    );

    const ixSlot = new ElemBytes().setBigInt(iX);
    const iySlot = new ElemBytes().setBigInt(iY);
    const vxSlot = new ElemBytes().setBigInt(vX);
    const vySlot = new ElemBytes().setBigInt(vY);
    newClaim(new SchemaHash(), withIndexData(ixSlot, iySlot), withValueData(vxSlot, vySlot));
    expect(ixSlot.toBigInt().toString()).toEqual(iX.toString());
    expect(iySlot.toBigInt().toString()).toEqual(iY.toString());
    expect(vxSlot.toBigInt().toString()).toEqual(vX.toString());
    expect(vySlot.toBigInt().toString()).toEqual(vY.toString());
  });

  it('new data slot from int', () => {
    const ds = new ElemBytes().setBigInt(
      BigInt('16243864111864693853212588481963275789994876191154110553066821559749894481761')
    );
    const expected = new ElemBytes(
      Uint8Array.from([
        0x61, 0x27, 0xa0, 0xeb, 0x58, 0x7a, 0x6c, 0x2b, 0x4a, 0xa8, 0xc1, 0x2e, 0xf5, 0x01, 0xb2,
        0xdb, 0xd0, 0x9c, 0xb1, 0xa5, 0x9c, 0x83, 0x42, 0x57, 0x91, 0xa5, 0x20, 0xbf, 0x86, 0xb3,
        0xe9, 0x23
      ])
    );
    expect(ds.bytes).toEqual(expected.bytes);
    expect(() =>
      new ElemBytes().setBigInt(
        BigInt('9916243864111864693853212588481963275789994876191154110553066821559749894481761')
      )
    ).toThrow(new Error(Constants.ERRORS.DATA_OVERFLOW));
  });

  it('index data ints', () => {
    const expSlot = new ElemBytes();
    expSlot.setBigInt(BigInt(0));
    const value = BigInt(64);

    const claim = newClaim(new SchemaHash(), withIndexDataInts(value, null));
    expect(expSlot.bytes).toEqual(claim.index[3].bytes);

    const claim2 = newClaim(new SchemaHash(), withIndexDataInts(null, value));
    expect(expSlot.bytes).toEqual(claim2.index[2].bytes);
  });

  it('value data ints', () => {
    const expSlot = new ElemBytes();
    expSlot.setBigInt(BigInt(0));
    const value = BigInt(64);
    const claim = newClaim(new SchemaHash(), withValueDataInts(value, null));
    expect(expSlot.bytes).toEqual(claim.value[3].bytes);

    const claim2 = newClaim(new SchemaHash(), withValueDataInts(null, value));
    expect(expSlot.bytes).toEqual(claim2.value[2].bytes);
  });

  it('with index data bytes', () => {
    const iX = BigInt(
      '124482786795178117845085577341029868555797443843373384650556214865383112817'
    );
    const expSlot = new ElemBytes();
    expSlot.setBigInt(BigInt(0));

    const claim = newClaim(new SchemaHash(), withIndexDataBytes(BytesHelper.intToBytes(iX), null));
    expect(expSlot.bytes).toEqual(claim.index[3].bytes);
  });

  describe('serialization', () => {
    it('with strings', () => {
      const input = `[
		  "15163995036539824738096525342132337704181738148399168403057770094395141110111",
		  "3206594817839378626027676511482956481343861686313501795018892230311002175077",
		  "7420031054231607091230846181053275837604749850669737756447914128096832575029",
		  "6843256246667081694694856844555135410358903741435158507252727716055448769466",
		  "18335061644187980192028500482619331449203987338928612566250871337402164885236",
		  "4747739418092571675618239353368909204965774632269590366651599441049750269324",
		  "10060277146294090095035892104009266064127776406104429246320070556972379481946",
		  "5835715034681704899254417398745238273415614452113785384300119694985241103333"
		  ]`;

      const expected = new Claim();
      expected.index = [
        new ElemBytes().slotFromHex(
          '5fb90badb37c5821b6d95526a41a9504680b4e7c8b763a1b1d49d4955c848621'
        ),
        new ElemBytes().slotFromHex(
          '65f606f6a63b7f3dfd2567c18979e4d60f26686d9bf2fb26c901ff354cde1607'
        ),
        new ElemBytes().slotFromHex(
          '35d6042c4160f38ee9e2a9f3fb4ffb0019b454d522b5ffa17604193fb8966710'
        ),
        new ElemBytes().slotFromHex(
          'ba53af19779cb2948b6570ffa0b773963c130ad797ddeafe4e3ad29b5125210f'
        )
      ];
      expected.value = [
        new ElemBytes().slotFromHex(
          'f4b6f44090a32711f3208e4e4b89cb5165ce64002cbd9c2887aa113df2468928'
        ),
        new ElemBytes().slotFromHex(
          '8ced323cb76f0d3fac476c9fb03fc9228fbae88fd580663a0454b68312207f0a'
        ),
        new ElemBytes().slotFromHex(
          '5a27db029de37ae37a42318813487685929359ca8c5eb94e152dc1af42ea3d16'
        ),
        new ElemBytes().slotFromHex(
          'e50be1a6dc1d5768e8537988fddce562e9b948c918bba3e933e5c400cde5e60c'
        )
      ];
      const claim = new Claim().unMarshalJson(input);
      expect(claim).toEqual(expected);

      const result = expected.marshalJson();
      expect(JSON.parse(input)).toEqual(JSON.parse(result));
    });

    it('with binary', () => {
      const binDataStr = [
        '5fb90badb37c5821b6d95526a41a9504680b4e7c8b763a1b1d49d4955c848621',
        '65f606f6a63b7f3dfd2567c18979e4d60f26686d9bf2fb26c901ff354cde1607',
        '35d6042c4160f38ee9e2a9f3fb4ffb0019b454d522b5ffa17604193fb8966710',
        'ba53af19779cb2948b6570ffa0b773963c130ad797ddeafe4e3ad29b5125210f',
        'f4b6f44090a32711f3208e4e4b89cb5165ce64002cbd9c2887aa113df2468928',
        '8ced323cb76f0d3fac476c9fb03fc9228fbae88fd580663a0454b68312207f0a',
        '5a27db029de37ae37a42318813487685929359ca8c5eb94e152dc1af42ea3d16',
        'e50be1a6dc1d5768e8537988fddce562e9b948c918bba3e933e5c400cde5e60c'
      ].join('');
      const binData = Hex.decodeString(binDataStr);

      const want = new Claim();
      want.index = [
        new ElemBytes().slotFromHex(
          '5fb90badb37c5821b6d95526a41a9504680b4e7c8b763a1b1d49d4955c848621'
        ),
        new ElemBytes().slotFromHex(
          '65f606f6a63b7f3dfd2567c18979e4d60f26686d9bf2fb26c901ff354cde1607'
        ),
        new ElemBytes().slotFromHex(
          '35d6042c4160f38ee9e2a9f3fb4ffb0019b454d522b5ffa17604193fb8966710'
        ),
        new ElemBytes().slotFromHex(
          'ba53af19779cb2948b6570ffa0b773963c130ad797ddeafe4e3ad29b5125210f'
        )
      ];
      want.value = [
        new ElemBytes().slotFromHex(
          'f4b6f44090a32711f3208e4e4b89cb5165ce64002cbd9c2887aa113df2468928'
        ),
        new ElemBytes().slotFromHex(
          '8ced323cb76f0d3fac476c9fb03fc9228fbae88fd580663a0454b68312207f0a'
        ),
        new ElemBytes().slotFromHex(
          '5a27db029de37ae37a42318813487685929359ca8c5eb94e152dc1af42ea3d16'
        ),
        new ElemBytes().slotFromHex(
          'e50be1a6dc1d5768e8537988fddce562e9b948c918bba3e933e5c400cde5e60c'
        )
      ];

      const result = new Claim();
      result.unMarshalBinary(binData);
      expect(want).toEqual(result);

      const marshalResult = want.marshalBinary();
      expect(binData).toEqual(marshalResult);
    });
  });

  describe('work with id', () => {
    it('id position', () => {
      const tests = [
        {
          name: 'self claim',
          claim: () => newClaim(new SchemaHash()),
          expectedPosition: IdPosition.None
        },
        {
          name: 'subject stored in index',
          claim: () => {
            const claim = newClaim(new SchemaHash());
            const genesis32bytes = BytesHelper.hashBytes('genesistest');
            const genesis = genesis32bytes.slice(0, 27);
            claim.setIndexId(new Id(Constants.ID.TYPE_DEFAULT, genesis));
            return claim;
          },
          expectedPosition: IdPosition.Index
        },
        {
          name: 'subject stored in value',
          claim: () => {
            const claim = newClaim(new SchemaHash());
            const genesis32bytes = BytesHelper.hashBytes('genesistest');
            const genesis = genesis32bytes.slice(0, 27);
            claim.setValueId(new Id(Constants.ID.TYPE_DEFAULT, genesis));
            return claim;
          },
          expectedPosition: IdPosition.Value
        }
      ];

      tests.forEach((test) => {
        const c = test.claim();
        const position = c.getIdPosition();
        expect(position).toEqual(test.expectedPosition);
      });
    });

    it('id position error case', () => {
      const tests = [
        {
          name: 'invalid position',
          claim: () => {
            const c = newClaim(new SchemaHash());
            c.setSubject(SubjectFlag.Invalid);
            return c;
          },
          expectedPosition: IdPosition.None,
          expectedError: new Error(Constants.ERRORS.INVALID_SUBJECT_POSITION)
        }
      ];

      tests.forEach((tt) => {
        const c = tt.claim();
        expect(() => c.getIdPosition()).toThrow(tt.expectedError);
      });
    });
  });

  describe('merklization', () => {
    const tests = [
      {
        name: 'not merklized',
        claim: () => newClaim(new SchemaHash()),
        expectedPosition: MerklizePosition.None
      },
      {
        name: 'mt root stored in index',
        claim: () => {
          const claim = newClaim(new SchemaHash());
          claim.setFlagMerklize(MerklizePosition.Index);
          return claim;
        },
        expectedPosition: MerklizePosition.Index
      },
      {
        name: 'mt root stored in value',
        claim: () => {
          const claim = newClaim(new SchemaHash());
          claim.setFlagMerklize(MerklizePosition.Value);
          return claim;
        },
        expectedPosition: MerklizePosition.Value
      },
      {
        name: 'mt root random bits',
        claim: () => {
          const c = newClaim(new SchemaHash());
          c.setFlagMerklize(MerklizePosition.Value);
          return c;
        },
        expectedPosition: MerklizePosition.Value
      }
    ];

    tests.forEach((test) => {
      it(test.name, () => {
        const c = test.claim();
        const position = c.getMerklizePosition();
        expect(position).toEqual(test.expectedPosition);
      });
    });

    it('Error Case', () => {
      const c = newClaim(new SchemaHash());
      c.index[0].bytes[Flags.ByteIdx] &= 0b11111000;
      c.index[0].bytes[Flags.ByteIdx] |= MerklizeFlag.Invalid;
      expect(() => c.getMerklizePosition()).toThrow(
        new Error(Constants.ERRORS.INCORRECT_MERKLIZE_POSITION)
      );
    });

    it('WithFlagMerklized', () => {
      const claim = newClaim(new SchemaHash(), withFlagMerklize(MerklizePosition.Index));
      expect(MerklizeFlag.Index).toEqual(claim.index[0].bytes[Flags.ByteIdx] & 0b11100000);
    });
  });
});

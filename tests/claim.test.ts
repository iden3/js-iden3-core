import { BytesHelper, ElemBytes } from './../src/elemBytes';
import {
  Claim,
  ClaimOptions,
  Flags,
  IdPosition,
  MerklizedFlag,
  MerklizedRootPosition,
  SubjectFlag
} from '../src/claim';
import { SchemaHash } from '../src/schemaHash';
import { Constants } from '../src/constants';
import { Id } from '../src/id';
import { Hex, poseidon } from '@iden3/js-crypto';
describe('claim test', () => {
  it('new claim', () => {
    const claim = Claim.newClaim(new SchemaHash(), ClaimOptions.withFlagUpdatable(true));
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

  it('raw slots', () => {
    const claim = Claim.newClaim(new SchemaHash(), ClaimOptions.withFlagUpdatable(true));
    const { index, value } = claim.rawSlots();
    const indexHash = poseidon.hash([
      index[0].toBigInt(),
      index[1].toBigInt(),
      index[2].toBigInt(),
      index[3].toBigInt()
    ]);
    const valueHash = poseidon.hash([
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

  it('getSchemaHash', () => {
    const sc = new SchemaHash(
      Uint8Array.from(Array.from({ length: 16 }, () => Math.floor(Math.random() * 16)))
    );
    expect(sc.bytes.length).toEqual(16);
    const claim = Claim.newClaim(sc);
    expect(sc.bytes).toEqual(claim.index[0].bytes.slice(0, sc.bytes.length));
    const shFromClaim = claim.getSchemaHash();
    const shFromClaimHexBytes = shFromClaim.marshalText();
    expect(Hex.encodeString(sc.bytes)).toEqual(shFromClaimHexBytes);
  });

  it('getFlagUpdatable', () => {
    const sc = new SchemaHash();
    let claim = Claim.newClaim(sc);
    expect(claim.getFlagUpdatable()).toBeFalsy();

    claim.setFlagUpdatable(true);
    expect(claim.getFlagUpdatable()).toBeTruthy();

    claim.setFlagUpdatable(false);
    expect(claim.getFlagUpdatable()).toBeFalsy();

    claim = Claim.newClaim(sc, ClaimOptions.withFlagUpdatable(true));
    expect(claim.getFlagUpdatable()).toBeTruthy();

    claim = Claim.newClaim(sc, ClaimOptions.withFlagUpdatable(false));
    expect(claim.getFlagUpdatable()).toBeFalsy();
  });

  it('getVersion', () => {
    const sc = new SchemaHash();
    const maxUint32 = Math.pow(2, 32) - 1;
    const claim = Claim.newClaim(sc, ClaimOptions.withVersion(maxUint32));
    expect(maxUint32).toEqual(claim.getVersion());
    const randomInt = Math.floor(Math.random() * maxUint32);
    claim.setVersion(randomInt);
    expect(randomInt).toEqual(claim.getVersion());
  });

  it('getRevocationNonce', () => {
    const sc = new SchemaHash();
    const nonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    const claim = Claim.newClaim(sc, ClaimOptions.withRevocationNonce(BigInt(nonce)));
    expect(nonce.toString()).toEqual(claim.getRevocationNonce().toString());
    const nonce2 = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    claim.setRevocationNonce(BigInt(nonce2));
    expect(nonce2.toString()).toEqual(claim.getRevocationNonce().toString());
  });

  it('expirationDate', () => {
    const sh = new SchemaHash();
    const expDate = new Date();
    expDate.setSeconds(0, 0);
    const c1 = Claim.newClaim(sh, ClaimOptions.withExpirationDate(expDate));

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
    Claim.newClaim(
      new SchemaHash(),
      ClaimOptions.withIndexData(ixSlot, iySlot),
      ClaimOptions.withValueData(vxSlot, vySlot)
    );
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
    ).toThrow(Constants.ERRORS.DATA_OVERFLOW);
  });

  it('index data ints', () => {
    const value = BigInt(1024);
    const expSlot = new ElemBytes();
    expSlot.setBigInt(value);

    const claim = Claim.newClaim(new SchemaHash(), ClaimOptions.withIndexDataInts(value, null));
    expect(expSlot.bytes).toEqual(claim.index[2].bytes);
    expect(new Uint8Array(32)).toEqual(claim.index[3].bytes);

    const claim2 = Claim.newClaim(new SchemaHash(), ClaimOptions.withIndexDataInts(null, value));
    expect(new Uint8Array(32)).toEqual(claim2.index[2].bytes);
    expect(expSlot.bytes).toEqual(claim2.index[3].bytes);
  });

  it('value data ints', () => {
    const value = BigInt(1024);
    const expSlot = new ElemBytes();
    expSlot.setBigInt(value);
    const claim = Claim.newClaim(new SchemaHash(), ClaimOptions.withValueDataInts(value, null));
    expect(expSlot.bytes).toEqual(claim.value[2].bytes);

    const claim2 = Claim.newClaim(new SchemaHash(), ClaimOptions.withValueDataInts(null, value));
    expect(expSlot.bytes).toEqual(claim2.value[3].bytes);
  });

  it('ClaimOptions.with index data bytes', () => {
    const iX = BigInt(
      '124482786795178117845085577341029868555797443843373384650556214865383112817'
    );
    const expSlot = new ElemBytes().setBigInt(BigInt(iX));

    const claim = Claim.newClaim(
      new SchemaHash(),
      ClaimOptions.withIndexDataBytes(expSlot.bytes, null)
    );
    expect(expSlot.bytes).toEqual(claim.index[2].bytes);
  });

  it('proof case test', () => {
    const expSlot = new ElemBytes();
    expSlot.setBigInt(BigInt(0));

    const indexA = new Uint8Array([
      104, 146, 48, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0
    ]);
    const indexB = new Uint8Array([
      99, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0
    ]);

    const valueA = new Uint8Array([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2
    ]);

    const valueB = new Uint8Array([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      18
    ]);

    const claim = Claim.newClaim(
      new SchemaHash(),
      ClaimOptions.withIndexDataBytes(indexA, indexB),
      ClaimOptions.withValueDataBytes(valueA, valueB)
    );

    expect(indexA).toEqual(claim.index[2].bytes);
    expect(indexB).toEqual(claim.index[3].bytes);
    expect(valueA).toEqual(claim.value[2].bytes);
    expect(valueB).toEqual(claim.value[3].bytes);
  });

  describe('serialization', () => {
    it('ClaimOptions.with strings', () => {
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
      expect(JSON.parse(input)).toEqual(result);
    });

    it('ClaimOptions.with binary', () => {
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

  describe('work ClaimOptions.with id', () => {
    it('id position', () => {
      const tests = [
        {
          name: 'self claim',
          claim: () => Claim.newClaim(new SchemaHash()),
          expectedPosition: IdPosition.None
        },
        {
          name: 'subject stored in index',
          claim: () => {
            const claim = Claim.newClaim(new SchemaHash());
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
            const claim = Claim.newClaim(new SchemaHash());
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
            const c = Claim.newClaim(new SchemaHash());
            c.setSubject(SubjectFlag.Invalid);
            return c;
          },
          expectedPosition: IdPosition.None,
          expectedError: Constants.ERRORS.INVALID_SUBJECT_POSITION
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
        claim: () => Claim.newClaim(new SchemaHash()),
        expectedPosition: MerklizedRootPosition.None
      },
      {
        name: 'mt root stored in index',
        claim: () => {
          const claim = Claim.newClaim(new SchemaHash());
          claim.setFlagMerklized(MerklizedRootPosition.Index);
          return claim;
        },
        expectedPosition: MerklizedRootPosition.Index
      },
      {
        name: 'mt root stored in value',
        claim: () => {
          const claim = Claim.newClaim(new SchemaHash());
          claim.setFlagMerklized(MerklizedRootPosition.Value);
          return claim;
        },
        expectedPosition: MerklizedRootPosition.Value
      },
      {
        name: 'mt root random bits',
        claim: () => {
          const c = Claim.newClaim(new SchemaHash());
          c.setFlagMerklized(MerklizedRootPosition.Value);
          return c;
        },
        expectedPosition: MerklizedRootPosition.Value
      }
    ];

    tests.forEach((test) => {
      it(test.name, () => {
        const c = test.claim();
        const position = c.getMerklizedPosition();
        expect(position).toEqual(test.expectedPosition);
      });
    });

    it('Error Case', () => {
      const c = Claim.newClaim(new SchemaHash());
      c.index[0].bytes[Flags.ByteIdx] &= 0b11111000;
      c.index[0].bytes[Flags.ByteIdx] |= MerklizedFlag.Invalid;
      expect(() => c.getMerklizedPosition()).toThrow(Constants.ERRORS.INCORRECT_MERKLIZED_POSITION);
    });

    it('ClaimOptions.WithFlagMerklized', () => {
      const claim = Claim.newClaim(
        new SchemaHash(),
        ClaimOptions.withFlagMerklized(MerklizedRootPosition.Index)
      );
      expect(MerklizedFlag.Index).toEqual(claim.index[0].bytes[Flags.ByteIdx] & 0b11100000);
    });

    it('withIndexMerklizedRoot', () => {
      const expVal = BigInt(9999);
      const expSlot = new ElemBytes();
      expSlot.setBigInt(expVal);

      const claim = Claim.newClaim(new SchemaHash(), ClaimOptions.withIndexMerklizedRoot(expVal));
      expect(expSlot).toEqual(claim.index[2]);

      const position = claim.getMerklizedPosition();
      expect(MerklizedRootPosition.Index).toEqual(position);
    });

    it('WithValueMerklizedRoot', () => {
      const expVal = BigInt(9999);
      const expSlot = new ElemBytes();
      expSlot.setBigInt(expVal);

      const claim = Claim.newClaim(new SchemaHash(), ClaimOptions.withValueMerklizedRoot(expVal));
      expect(expSlot).toEqual(claim.value[2]);

      const position = claim.getMerklizedPosition();
      expect(MerklizedRootPosition.Value).toEqual(position);
    });

    it('ClaimOptions.withMerklizedRoot', () => {
      const expVal = BigInt(9999);
      const expSlot = new ElemBytes();
      expSlot.setBigInt(expVal);

      const claim = Claim.newClaim(
        new SchemaHash(),
        ClaimOptions.withMerklizedRoot(expVal, MerklizedRootPosition.Index)
      );
      expect(expSlot).toEqual(claim.index[2]);

      const position = claim.getMerklizedPosition();
      expect(MerklizedRootPosition.Index).toEqual(position);

      const claim2 = Claim.newClaim(
        new SchemaHash(),
        ClaimOptions.withMerklizedRoot(expVal, MerklizedRootPosition.Value)
      );
      expect(expSlot).toEqual(claim2.value[2]);

      const position2 = claim2.getMerklizedPosition();
      expect(MerklizedRootPosition.Value).toEqual(position2);
    });

    it('setMerklizedRoot', () => {
      const expVal = BigInt(9999);
      const expSlot = new ElemBytes();
      expSlot.setBigInt(expVal);

      const claim = Claim.newClaim(new SchemaHash());

      claim.setIndexMerklizedRoot(expVal);
      expect(expSlot).toEqual(claim.index[2]);

      const position = claim.getMerklizedPosition();
      expect(MerklizedRootPosition.Index).toEqual(position);

      const r = claim.getMerklizedRoot();
      expect(expVal).toEqual(r);

      const claim2 = Claim.newClaim(new SchemaHash());

      claim2.setValueMerklizedRoot(expVal);
      expect(expSlot).toEqual(claim2.value[2]);

      const position2 = claim2.getMerklizedPosition();
      expect(MerklizedRootPosition.Value).toEqual(position2);

      const r2 = claim2.getMerklizedRoot();
      expect(r2).toEqual(expVal);

      const claim3 = Claim.newClaim(new SchemaHash());

      const position3 = claim3.getMerklizedPosition();
      expect(MerklizedRootPosition.None).toEqual(position3);
      expect(() => claim3.getMerklizedRoot()).toThrow(Constants.ERRORS.NO_MERKLIZED_ROOT);
    });
  });

  it('set index ID value', () => {
    const id = Id.fromString('ww9xPmW6U3k6XatpaPPWbqPgUqW2Ct6AhsGNuYGm2');
    const claim = new Claim();
    claim.setIndexId(id);
    const expectedId = claim.getIndexId();
    expect(id).toEqual(expectedId);
  });

  it('set value ID value', () => {
    const id = Id.fromString('ww9xPmW6U3k6XatpaPPWbqPgUqW2Ct6AhsGNuYGm2');
    const claim = new Claim();
    claim.setValueId(id);
    const expectedId = claim.getValueId();
    expect(id).toEqual(expectedId);
  });
});

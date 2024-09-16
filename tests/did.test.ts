import { Hex } from '@iden3/js-crypto';
import { DID, buildDIDType } from '../src/did';
import { Id } from '../src/id';
import { Blockchain, DidMethodByte, DidMethod, NetworkId, Constants } from './../src/constants';
import { genesisFromEthAddress } from '../src/utils';
import { registerDidMethodNetwork } from '../src/registration';

export const helperBuildDIDFromType = (
  method: string,
  blockchain: string,
  network: string
): DID => {
  const typ = buildDIDType(method, blockchain, network);
  return DID.newFromIdenState(typ, 1n);
};

describe('DID tests', () => {
  it('TestParseDID', () => {
    // did
    let didStr = 'did:iden3:polygon:mumbai:wyFiV4w71QgWPn6bYLsZoysFay66gKtVa9kfu6yMZ';

    let did3 = DID.parse(didStr);
    let id = DID.idFromDID(did3);
    expect('wyFiV4w71QgWPn6bYLsZoysFay66gKtVa9kfu6yMZ').toEqual(id.string());
    let method = DID.methodFromId(id);
    expect(DidMethod.Iden3).toBe(method);
    let blockchain = DID.blockchainFromId(id);
    expect(Blockchain.Polygon).toBe(blockchain);
    let networkId = DID.networkIdFromId(id);
    expect(NetworkId.Mumbai).toBe(networkId);

    // readonly did
    didStr = 'did:iden3:readonly:tN4jDinQUdMuJJo6GbVeKPNTPCJ7txyXTWU4T2tJa';

    did3 = DID.parse(didStr);

    id = DID.idFromDID(did3);
    expect('tN4jDinQUdMuJJo6GbVeKPNTPCJ7txyXTWU4T2tJa').toBe(id.string());
    method = DID.methodFromId(id);
    expect(DidMethod.Iden3).toBe(method);
    blockchain = DID.blockchainFromId(id);
    expect(Blockchain.ReadOnly).toBe(blockchain);
    networkId = DID.networkIdFromId(id);
    expect(NetworkId.NoNetwork).toBe(networkId);

    expect(Uint8Array.from([DidMethodByte[DidMethod.Iden3], 0b0])).toStrictEqual(id.type());
  });

  it('TestDID_UnmarshalJSON', () => {
    const parseRes = JSON.parse(
      `{"obj": "did:iden3:polygon:mumbai:wyFiV4w71QgWPn6bYLsZoysFay66gKtVa9kfu6yMZ"}`
    );
    const id = Id.fromString('wyFiV4w71QgWPn6bYLsZoysFay66gKtVa9kfu6yMZ');

    const obj = DID.parse(parseRes.obj);
    expect(obj).toBeDefined();
    expect(DidMethod.Iden3).toBe(obj.method);

    const id2 = DID.idFromDID(DID.parse(parseRes.obj));
    const method = DID.methodFromId(id2);
    expect(DidMethod.Iden3).toBe(method);
    const blockchain = DID.blockchainFromId(id2);
    expect(Blockchain.Polygon).toBe(blockchain);
    const networkID = DID.networkIdFromId(id2);
    expect(NetworkId.Mumbai).toBe(networkID);

    expect(id).toStrictEqual(id2);
  });

  it('TestDIDGenesisFromState', () => {
    const typ0 = buildDIDType(DidMethod.Iden3, Blockchain.ReadOnly, NetworkId.NoNetwork);

    const genesisState = BigInt(1);
    const did2 = DID.newFromIdenState(typ0, genesisState);

    expect(DidMethod.Iden3).toBe(did2.method);

    const id = DID.idFromDID(did2);
    const method = DID.methodFromId(id);
    expect(DidMethod.Iden3).toBe(method);
    const blockchain = DID.blockchainFromId(id);
    expect(Blockchain.ReadOnly).toBe(blockchain);
    const networkID = DID.networkIdFromId(id);
    expect(NetworkId.NoNetwork).toBe(networkID);

    expect('did:iden3:readonly:tJ93RwaVfE1PEMxd5rpZZuPtLCwbEaDCrNBhAy8HM').toBe(did2.string());
  });

  it('TestDIDFromID', () => {
    const typ0 = buildDIDType(DidMethod.Iden3, Blockchain.ReadOnly, NetworkId.NoNetwork);

    const genesisState = BigInt(1);
    const id = Id.idGenesisFromIdenState(typ0, genesisState);

    const did2 = DID.parseFromId(id);

    expect('did:iden3:readonly:tJ93RwaVfE1PEMxd5rpZZuPtLCwbEaDCrNBhAy8HM').toBe(did2.string());
  });

  it('Test DID to JSON', () => {
    const didStr = 'did:polygonid:linea:sepolia:32232vGknSaJHfCBffnbzHzYYy6FvHDkK9QL4SFAq6';
    const did = DID.parse(didStr);
    const field1Val = 'field1';
    const objWithDid = {
      field1: field1Val,
      did
    };
    const stringify = JSON.stringify(objWithDid);
    expect(stringify).toBe(`{"field1":"${field1Val}","did":"${didStr}"}`);
  });

  describe('Test DID build from types', () => {
    const testCases = [
      {
        title: 'Polygon no chain, no network',
        method: DidMethod.PolygonId,
        chain: Blockchain.ReadOnly,
        net: NetworkId.NoNetwork,
        wantDID: 'did:polygonid:readonly:2mbH5rt9zKT1mTivFAie88onmfQtBU9RQhjNPLwFZh'
      },
      {
        title: 'Polygon | Polygon chain, Main',
        method: DidMethod.PolygonId,
        chain: Blockchain.Polygon,
        net: NetworkId.Main,
        wantDID: 'did:polygonid:polygon:main:2pzr1wiBm3Qhtq137NNPPDFvdk5xwRsjDFnMxpnYHm'
      },
      {
        title: 'Polygon | Polygon chain, Mumbai',
        method: DidMethod.PolygonId,
        chain: Blockchain.Polygon,
        net: NetworkId.Mumbai,
        wantDID: 'did:polygonid:polygon:mumbai:2qCU58EJgrELNZCDkSU23dQHZsBgAFWLNpNezo1g6b'
      },
      {
        title: 'Polygon | zkEVM chain, main',
        method: DidMethod.PolygonId,
        chain: Blockchain.Polygon,
        net: NetworkId.Zkevm,
        wantDID: 'did:polygonid:polygon:zkevm:2qbiBVGYYTsbL1ab2afHNTh1S7P6btmYhwZF4jTwiF'
      },
      {
        title: 'Polygon | zkEVM chain, test',
        method: DidMethod.PolygonId,
        chain: Blockchain.Polygon,
        net: NetworkId.Cardona,
        wantDID: 'did:polygonid:polygon:cardona:2qoLEfnfUGhDojmmfekv2sqNNEUopiQ9sW9Y6hh5X5'
      },
      {
        title: 'Polygon chain, Amoy',
        method: DidMethod.PolygonId,
        chain: Blockchain.Polygon,
        net: NetworkId.Amoy,
        wantDID: 'did:polygonid:polygon:amoy:2qQ68JkRcf3xrHPQPWZei3YeVzHPP58wYNxx2mEouR'
      },
      {
        title: 'Privado chain, Main',
        method: DidMethod.Iden3,
        chain: Blockchain.Privado,
        net: NetworkId.Main,
        wantDID: 'did:iden3:privado:main:2SZDsdYordSGMMQVXTVbCb7W834NBTBpkKZUAFRoGb'
      },
      {
        title: 'Privado chain, Test',
        method: DidMethod.Iden3,
        chain: Blockchain.Privado,
        net: NetworkId.Test,
        wantDID: 'did:iden3:privado:test:2Skqvp4vnSFtq5bgAXbDs1Fs4AA5QGpRut9mCDew5R'
      },
      {
        title: 'Linea chain, Main',
        method: DidMethod.Iden3,
        chain: Blockchain.Linea,
        net: NetworkId.Main,
        wantDID: 'did:iden3:linea:main:28vX3frJDbAvHLSMHEwxuxRk1GPpjBeUEsXdAwVxDm'
      },
      {
        title: 'Linea chain, Test',
        method: DidMethod.Iden3,
        chain: Blockchain.Linea,
        net: NetworkId.Sepolia,
        wantDID: 'did:iden3:linea:sepolia:28itzVLBHnMHocFAeArLFYHP59J7WN1s5JwL8yGpQw'
      }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      it(tc.title, () => {
        const did = helperBuildDIDFromType(tc.method, tc.chain, tc.net);
        expect(tc.method).toEqual(did.method);
        const id = DID.idFromDID(did);
        const method = DID.methodFromId(id);
        expect(tc.method).toEqual(method);
        const blockchain = DID.blockchainFromId(id);
        expect(tc.chain).toEqual(blockchain);
        const networkID = DID.networkIdFromId(id);
        expect(tc.net).toEqual(networkID);
        expect(tc.wantDID).toEqual(did.string());
        expect(DID.idFromDID(DID.parse(tc.wantDID)).string()).toEqual(
          did.string().split(':').pop()
        );
      });
    }
  });

  it('TestDID_PolygonID_DID.parseFromId', () => {
    const id1 = Id.fromString('2qCU58EJgrEM9NKvHkvg5NFWUiJPgN3M3LnCr98j3x');

    const did = DID.parseFromId(id1);

    const addressBytesExp = Hex.decodeString('A51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0').slice(
      0,
      Constants.ETH_ADDRESS_LENGTH
    );

    expect(DidMethod.PolygonId).toBe(did.method);
    const wantIDs = ['polygon', 'mumbai', '2qCU58EJgrEM9NKvHkvg5NFWUiJPgN3M3LnCr98j3x'];
    expect(wantIDs).toStrictEqual(did.idStrings);
    const id = DID.idFromDID(did);
    const method = DID.methodFromId(id);
    expect(DidMethod.PolygonId).toBe(method);
    const blockchain = DID.blockchainFromId(id);
    expect(Blockchain.Polygon).toBe(blockchain);
    const networkID = DID.networkIdFromId(id);
    expect(NetworkId.Mumbai).toBe(networkID);

    const ethAddr = Id.ethAddressFromId(id);
    expect(addressBytesExp).toStrictEqual(ethAddr);

    expect('did:polygonid:polygon:mumbai:2qCU58EJgrEM9NKvHkvg5NFWUiJPgN3M3LnCr98j3x').toBe(
      did.string()
    );
  });

  it('TestDecompose', () => {
    const wantIDHex = '2qCU58EJgrEM9NKvHkvg5NFWUiJPgN3M3LnCr98j3x';
    const ethAddrHex = 'a51c1fc2f0d1a1b8494ed1fe312d7c3a78ed91c0';
    const genesis = Hex.decodeString('00000000000000' + ethAddrHex).slice(
      0,
      Constants.GENESIS_LENGTH
    );
    const tp = buildDIDType(DidMethod.PolygonId, Blockchain.Polygon, NetworkId.Mumbai);
    const id0 = new Id(tp, genesis);

    const s = `did:polygonid:polygon:mumbai:${id0.string()}`;

    const did = DID.parse(s);

    const wantID = Id.fromString(wantIDHex);

    const id = DID.idFromDID(did);
    expect(wantID).toStrictEqual(id);

    const method = DID.methodFromId(id);
    expect(DidMethod.PolygonId).toBe(method);

    const blockchain = DID.blockchainFromId(id);
    expect(Blockchain.Polygon).toBe(blockchain);

    const networkID = DID.networkIdFromId(id);
    expect(NetworkId.Mumbai).toBe(networkID);

    const ethAddr = Id.ethAddressFromId(id);
    expect(Hex.decodeString(ethAddrHex).slice(0, 20)).toStrictEqual(ethAddr);
  });

  it('TestNewDID.fromDID', () => {
    const did1 = DID.parse('did:something:x');
    const id = DID.idFromUnsupportedDID(did1);
    expect(Uint8Array.from([0xff, 0xff])).toStrictEqual(id.bytes.slice(0, 2));
    const wantID = Hex.decodeString(
      'ffff84b1e6d0d9ecbe951348ea578dbacc022cdbbff4b11218671dca871c11'
    );
    expect(wantID).toStrictEqual(id.bytes);

    const id2 = DID.idFromDID(did1);
    expect(id).toStrictEqual(id2);
  });

  it('TestGenesisFromEthAddress', () => {
    const ethAddrHex = 'accb91a7d1d9ad0d33b83f2546ed30285c836c6e';
    const wantGenesisHex = '00000000000000accb91a7d1d9ad0d33b83f2546ed30285c836c6e';
    expect(ethAddrHex).toHaveLength(20 * 2);
    expect(wantGenesisHex).toHaveLength(27 * 2);

    const ethAddrBytes = Hex.decodeString(ethAddrHex);
    const ethAddr = ethAddrBytes.slice(0, 20);
    const genesis = genesisFromEthAddress(ethAddr);
    const wantGenesis = Hex.decodeString(wantGenesisHex);
    expect(wantGenesis).toStrictEqual(genesis);

    const tp2 = buildDIDType(DidMethod.PolygonId, Blockchain.Polygon, NetworkId.Mumbai);

    let id = new Id(tp2, genesis);
    const ethAddr2 = Id.ethAddressFromId(id);
    expect(ethAddr).toStrictEqual(ethAddr2);

    const wantID = new Id(tp2, genesis);
    expect(wantID).toStrictEqual(id);

    // make genesis not look like an address
    genesis[0] = 1;
    id = new Id(tp2, genesis);
    expect(() => Id.ethAddressFromId(id)).toThrowError(
      "can't get Ethereum address: high bytes of genesis are not zero"
    );
  });

  it('TestCustomDIDRegistration', () => {
    const testCases = [
      {
        description: 'register new did method network',
        data: {
          method: 'test_method',
          blockchain: 'test_chain',
          network: 'test_net',
          networkFlag: 0b0001_0001,
          chainId: 101,
          methodByte: 0b00000011
        }
      },
      {
        description: 'register one more new did method network',
        data: {
          method: 'method',
          blockchain: 'chain',
          network: 'network',
          networkFlag: 0b0001_0001,
          chainId: 102,
          methodByte: 0b00000100
        }
      },
      {
        description: 'register the same new did method network',
        data: {
          method: 'method',
          blockchain: 'chain',
          network: 'network',
          networkFlag: 0b0001_0001,
          chainId: 102,
          methodByte: 0b00000100
        }
      },
      {
        description: 'register network to existing did method',
        data: {
          method: DidMethod.Iden3,
          blockchain: 'chain',
          network: NetworkId.Test,
          networkFlag: 0b01000000 | 0b00000011,
          chainId: 103
        }
      },
      {
        description: 'register network to existing did method and chainId',
        data: {
          method: DidMethod.Iden3,
          blockchain: Blockchain.ReadOnly,
          network: NetworkId.NoNetwork,
          networkFlag: 0b00000000,
          chainId: 104
        }
      },
      {
        description: 'register one more network to existing did method',
        data: {
          method: DidMethod.Iden3,
          blockchain: Blockchain.ReadOnly,
          network: 'network',
          networkFlag: 0b11000000 | 0b00000011,
          chainId: 105
        }
      },
      {
        description: 'register known chain id to new did method',
        data: {
          method: 'method2',
          blockchain: Blockchain.Polygon,
          network: NetworkId.Mumbai,
          networkFlag: 0b0001_0001,
          methodByte: 0b0000111
        }
      },
      {
        description: 'register same did network flag',
        data: {
          method: 'iden3',
          blockchain: Blockchain.ReadOnly,
          network: NetworkId.NoNetwork,
          networkFlag: 0b0000_0000
        }
      }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      expect(() => registerDidMethodNetwork(tc.data)).not.toThrow();
    }

    const d = helperBuildDIDFromType('method', 'chain', 'network');
    // const did = helperBuildDIDFromType('method', 'chain', 'network');
    expect('4bb86obLkMrifHixMY62WM4iQQVr7u29cxWjMAinrT').toEqual(d.string().split(':').pop());

    // did
    const didStr = 'did:method:chain:network:4bb86obLkMrifHixMY62WM4iQQVr7u29cxWjMAinrT';

    const did3 = DID.parse(didStr);
    const id = DID.idFromDID(did3);

    expect('4bb86obLkMrifHixMY62WM4iQQVr7u29cxWjMAinrT').toEqual(id.string());
    const method = DID.methodFromId(id);
    expect(DidMethod.method).toBe(method);
    const blockchain = DID.blockchainFromId(id);
    expect(Blockchain.chain).toBe(blockchain);
    const networkId = DID.networkIdFromId(id);
    expect(NetworkId.network).toBe(networkId);
  });

  const testCases = [
    {
      description: 'try to overwrite existing chain id',
      data: {
        method: DidMethod.Iden3,
        blockchain: Blockchain.Polygon,
        network: NetworkId.Mumbai,
        networkFlag: 0b0001_0001,
        chainId: 1
      },
      err: "can't register chainId 1 for 'polygon:mumbai' because it's already registered for another chain id"
    },
    {
      description: 'try to overwrite existing DID method byte',
      data: {
        method: DidMethod.Iden3,
        blockchain: Blockchain.Ethereum,
        network: NetworkId.Main,
        networkFlag: 0b00100000 | 0b00000001,
        chainId: 1,
        methodByte: 0b00000010
      },
      err: "can't register method 'iden3' because DID method byte '10' already registered"
    },
    {
      description: 'try to write max did method byte',
      data: {
        method: 'method33',
        blockchain: Blockchain.Ethereum,
        network: NetworkId.Main,
        networkFlag: 0b00100000 | 0b00000001,
        chainId: 1,
        methodByte: 0b11111111
      },
      err: "Can't register DID method byte: current '11111111', maximum byte allowed: '11111110'"
    },
    {
      description: 'try to rewrite existing DID Method Network Flag',
      data: {
        method: DidMethod.Iden3,
        blockchain: Blockchain.Ethereum,
        network: NetworkId.Main,
        networkFlag: 0b00100000 | 0b00000011
      },
      err: "DID network flag 100011 is already registered for the another network id for 'iden3' method"
    },
    {
      description: 'register new did method with existing method byte',
      data: {
        method: 'new_method',
        blockchain: 'new_chain',
        network: 'new_net',
        networkFlag: 0b0001_0001,
        chainId: 101,
        methodByte: 0b00000001
      },
      err: "DID method byte '1' already registered"
    },
    {
      description: 'register new did method with existing chain id',
      data: {
        method: 'new_method',
        blockchain: Blockchain.Ethereum,
        network: NetworkId.Main,
        networkFlag: 0b0001_0001,
        chainId: 101,
        methodByte: 0b10000000
      },
      err: "can't register chainId 101 for 'eth:main' because it's already registered for another chain id"
    },
    {
      description:
        'register new network and chain with existing networkFlag for existing existing did method',
      data: {
        method: DidMethod.Iden3,
        blockchain: 'supa_chain',
        network: 'supa_net',
        networkFlag: 0b00010000 | 0b00000001
      },
      err: `DID network flag 10001 is already registered for the another network id for 'iden3' method`
    }
  ];
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    it(tc.description, () => {
      expect(() => registerDidMethodNetwork(tc.data)).toThrowError(tc.err);
    });
  }
});

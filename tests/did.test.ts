import { DID, NetworkId, DIDMethodByte, DidMethod, Blockchain, buildDIDType } from './../src/did';

const helperBuildDIDFromType = (
  method: DidMethod,
  blockchain: Blockchain,
  network: NetworkId
): DID => {
  const typ = buildDIDType(method, blockchain, network);

  const genesisState = BigInt(1);
  const did = DID.fromGenesisFromIdenState(typ, genesisState);

  return did;
};

describe('DID tests', () => {
  it('parse DID', () => {
    let didStr = 'did:iden3:polygon:mumbai:wyFiV4w71QgWPn6bYLsZoysFay66gKtVa9kfu6yMZ';
    let did = DID.parse(didStr);

    buildDIDType(DidMethod.Iden3, Blockchain.NoChain, NetworkId.NoNetwork);

    expect('wyFiV4w71QgWPn6bYLsZoysFay66gKtVa9kfu6yMZ').toEqual(did.id.string());
    expect(NetworkId.Mumbai).toEqual(did.networkId);
    expect(Blockchain.Polygon).toEqual(did.blockchain);
    // readonly did
    didStr = 'did:iden3:tN4jDinQUdMuJJo6GbVeKPNTPCJ7txyXTWU4T2tJa';
    did = DID.parse(didStr);
    expect('tN4jDinQUdMuJJo6GbVeKPNTPCJ7txyXTWU4T2tJa').toEqual(did.id.string());
    expect('').toEqual(did.networkId);
    expect('').toEqual(did.blockchain);
    expect([DIDMethodByte[DidMethod.Iden3], 0b0]).toMatchObject(did.id.type());
  });
  it('TestDIDGenesisFromState', () => {
    const typ0 = buildDIDType(DidMethod.Iden3, Blockchain.NoChain, NetworkId.NoNetwork);
    const genesisState = BigInt(1);
    const did = DID.fromGenesisFromIdenState(typ0, genesisState);
    expect(DidMethod.Iden3).toEqual(did.method);
    expect(Blockchain.NoChain).toEqual(did.blockchain);
    expect(NetworkId.NoNetwork).toEqual(did.networkId);
    expect('did:iden3:tJ93RwaVfE1PEMxd5rpZZuPtLCwbEaDCrNBhAy8HM').toEqual(did.toString());
  });

  it('TestDID_PolygonID_Types', () => {
    // Polygon no chain, no network
    const did = helperBuildDIDFromType(
      DidMethod.PolygonId,
      Blockchain.NoChain,
      NetworkId.NoNetwork
    );

    expect(DidMethod.PolygonId).toEqual(did.method);
    expect(Blockchain.NoChain).toEqual(did.blockchain);
    expect(NetworkId.NoNetwork).toEqual(did.networkId);
    expect('did:polygonid:2mbH5rt9zKT1mTivFAie88onmfQtBU9RQhjNPLwFZh').toEqual(did.toString());

    // Polygon | Polygon chain, Main
    const did2 = helperBuildDIDFromType(DidMethod.PolygonId, Blockchain.Polygon, NetworkId.Main);

    expect(DidMethod.PolygonId).toEqual(did2.method);
    expect(Blockchain.Polygon).toEqual(did2.blockchain);
    expect(NetworkId.Main).toEqual(did2.networkId);
    expect('did:polygonid:polygon:main:2pzr1wiBm3Qhtq137NNPPDFvdk5xwRsjDFnMxpnYHm').toEqual(
      did2.toString()
    );

    // Polygon | Polygon chain, Mumbai
    const did3 = helperBuildDIDFromType(DidMethod.PolygonId, Blockchain.Polygon, NetworkId.Mumbai);

    expect(DidMethod.PolygonId).toEqual(did3.method);
    expect(Blockchain.Polygon).toEqual(did3.blockchain);
    expect(NetworkId.Mumbai).toEqual(did3.networkId);
    expect('did:polygonid:polygon:mumbai:2qCU58EJgrELNZCDkSU23dQHZsBgAFWLNpNezo1g6b').toEqual(
      did3.toString()
    );
  });
});

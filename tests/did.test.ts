import { DID, NetworkId, DIDMethodByte, DidMethod, withNetwork, Blockchain } from './../src/did';

describe('DID tests', () => {
  const tests: {
    did: string;
    description: string;
    options: (did: DID) => void;
    identifier: string;
  }[] = [
    {
      description: 'Test readonly did',
      identifier: 'tN4jDinQUdMuJJo6GbVeKPNTPCJ7txyXTWU4T2tJa',
      did: 'did:iden3:tN4jDinQUdMuJJo6GbVeKPNTPCJ7txyXTWU4T2tJa',
      options: () => {
        return null;
      }
    },
    {
      description: 'Test eth did',
      identifier: 'zyaYCrj27j7gJfrBboMW49HFRSkQznyy12ABSVzTy',
      did: 'did:iden3:eth:main:zyaYCrj27j7gJfrBboMW49HFRSkQznyy12ABSVzTy',
      options: withNetwork(Blockchain.Ethereum, NetworkId.Main)
    },
    {
      description: 'Test polygon did',
      identifier: 'wyFiV4w71QgWPn6bYLsZoysFay66gKtVa9kfu6yMZ',
      did: 'did:iden3:polygon:mumbai:wyFiV4w71QgWPn6bYLsZoysFay66gKtVa9kfu6yMZ',
      options: withNetwork(Blockchain.Polygon, NetworkId.Mumbai)
    }
  ];

  tests.forEach((test) => {
    it(test.description, () => {
      const got = DID.newDID(test.identifier, test.options);
      expect(got.toString()).toEqual(test.did);
    });
  });

  it('parse DID', () => {
    // did
    let didStr = 'did:iden3:polygon:mumbai:wyFiV4w71QgWPn6bYLsZoysFay66gKtVa9kfu6yMZ';
    let did = DID.parse(didStr);

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
});

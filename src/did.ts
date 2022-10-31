import { Id } from './id';
import { Constants } from './constants';

export enum Blockchain {
  Ethereum = 'eth',
  Polygon = 'polygon',
  Unknown = 'unknown',
  NoChain = ''
}

export enum NetworkId {
  Main = 'main',
  Mumbai = 'mumbai',
  Goerli = 'goerli',
  Unknown = 'unknown',
  NoNetwork = ''
}

export enum DidMethod {
  Iden3 = 'iden3'
}
export const DIDMethodByte: { [key: string]: number } = {
  [DidMethod.Iden3]: 0b00000001
};

// DIDNetworkFlag is a structure to represent DID blockchain and network id
export class DIDNetworkFlag {
  constructor(public readonly blockchain: Blockchain, public readonly networkId: NetworkId) {}

  toString(): string {
    return `${this.blockchain || '_'}:${this.networkId || '_'}`;
  }

  static fromString(s: string): DIDNetworkFlag {
    const [blockchain, networkId] = s.split(':');
    return new DIDNetworkFlag(
      blockchain.replace('_', '') as Blockchain,
      networkId.replace('_', '') as NetworkId
    );
  }
}

// DIDMethodNetwork is map for did methods and their blockchain networks
export const DIDMethodNetwork: {
  [k: string]: { [k: string]: number };
} = {
  [DidMethod.Iden3]: {
    '_:_': 0b00000000,
    'polygon:main': 0b00010000 | 0b00000001,
    'polygon:mumbai': 0b00010000 | 0b00000010,
    'ethereum:main': 0b00100000 | 0b00000001,
    'ethereum:goerli': 0b00100000 | 0b00000010
  }
};

// BuildDIDType builds bytes type from chain and network
export function buildDIDType(
  method: string,
  blockchain: Blockchain,
  network: NetworkId
): Uint8Array {
  const fb = DIDMethodByte[method];
  if (!fb) {
    throw new Error(`method ${method} is not defined in core lib`);
  }
  const methodFn = DIDMethodNetwork[method];
  if (!methodFn) {
    throw new Error(`method ${method} is not defined in core lib`);
  }
  const sb: number | undefined = methodFn[new DIDNetworkFlag(blockchain, network).toString()];
  if (!sb) {
    throw new Error(`blockchain ${blockchain} and network ${network} is not defined in core lib`);
  }
  return Uint8Array.from([fb, sb]);
}

// FindNetworkIDForDIDMethodByValue finds network by byte value
export function findNetworkIDForDIDMethodByValue(method: string, byteNumber: number): NetworkId {
  const methodMap = DIDMethodNetwork[method];
  if (!methodMap) {
    throw new Error(`did method ${method} is not defined in core lib`);
  }
  for (const [key, value] of Object.entries(methodMap)) {
    if (value === byteNumber) {
      return DIDNetworkFlag.fromString(key).networkId;
    }
  }
  return NetworkId.Unknown;
}

// findBlockchainForDIDMethodByValue finds blockchain type by byte value
export function findBlockchainForDIDMethodByValue(
  method: DidMethod,
  byteNumber: number
): Blockchain {
  const methodMap = DIDMethodNetwork[method];
  if (!methodMap) {
    throw new Error(`did method ${method} is not defined in core lib`);
  }
  for (const [key, value] of Object.entries(methodMap)) {
    if (value === byteNumber) {
      return DIDNetworkFlag.fromString(key).blockchain;
    }
  }
  return Blockchain.Unknown;
}

// findDIDMethodByValue finds did method by its byte value
export function findDIDMethodByValue(byteNumber: number): DidMethod {
  for (const [key, value] of Object.entries(DIDMethodByte)) {
    if (value === byteNumber) {
      return key as DidMethod;
    }
  }
  throw new Error(`bytes ${byteNumber} are not defined in core lib as valid did method`);
}

export type DIDOptions = (did: DID) => void;
// WithNetwork sets Blockchain and NetworkID (eth:main)
export function withNetwork(blockchain: Blockchain, network: NetworkId): DIDOptions {
  return (did: DID) => {
    did.networkId = network;
    did.blockchain = blockchain;
  };
}

// DID Decentralized Identifiers (DIDs)
// https://w3c.github.io/did-core/#did-syntax
export class DID {
  public method: DidMethod = DidMethod.Iden3;
  public id: Id = new Id(new Uint8Array(2), new Uint8Array(27));
  public blockchain: Blockchain = Blockchain.NoChain;
  public networkId: NetworkId = NetworkId.NoNetwork;

  // toString did as a string
  toString(): string {
    if (this.blockchain == '') {
      return [Constants.DID.DID_SCHEMA, DidMethod.Iden3, this.id.string()].join(':');
    }
    return [
      Constants.DID.DID_SCHEMA,
      DidMethod.Iden3,
      this.blockchain,
      this.networkId,
      this.id.string()
    ]
      .filter((i) => !!i)
      .join(':');
  }
  // ParseDIDFromID returns did from ID
  static parseFromId(id: Id): DID {
    const did = new DID();
    did.id = id;
    const typ = id.type();
    did.method = findDIDMethodByValue(typ[0]);
    did.blockchain = findBlockchainForDIDMethodByValue(did.method, typ[1]);
    did.networkId = findNetworkIDForDIDMethodByValue(did.method, typ[1]);
    return did;
  }

  // ParseDID method parse string and extract DID if string is valid Iden3 identifier
  static parse(s: string): DID {
    const args = s.split(':');
    const did = new DID();

    did.method = args[1] as DidMethod;

    switch (args.length) {
      case 5:
        // validate id
        did.id = Id.fromString(args[4]);
        did.blockchain = args[2] as Blockchain;
        did.networkId = args[3] as NetworkId;
        break;

      case 3:
        // validate readonly id
        did.id = Id.fromString(args[2]);
        did.blockchain = Blockchain.NoChain;
        did.networkId = NetworkId.NoNetwork;
        break;
    }

    // check did method defined in core lib
    const methodByte = DIDMethodByte[did.method];
    if (!methodByte) {
      throw new Error(`DIDMethodByte: did method ${did.method} is not defined in core lib`);
    }

    // check did network defined in core lib for did method
    const method = DIDMethodNetwork[did.method];
    if (!method) {
      throw new Error(`DIDMethodNetwork: did method ${did.method} is not defined in core lib`);
    }
    const byte: number = method[new DIDNetworkFlag(did.blockchain, did.networkId).toString()];

    if (!byte?.toString()) {
      throw new Error(
        `blockchain network "${did.blockchain} ${did.networkId}" is not defined for ${did.method} did method`
      );
    }

    // check id contains did network and method
    const d = DID.parseFromId(did.id);

    if (d.method !== did.method) {
      throw new Error(
        `did method of core identity ${did.method} differs from given did method ${did.method}`
      );
    }
    if (d.networkId !== did.networkId) {
      throw new Error(
        `network method of core identity ${d.networkId} differs from given did network specific id ${did.networkId}`
      );
    }
    if (d.blockchain !== did.blockchain) {
      throw new Error(
        `blockchain network of core identity ${d.blockchain} differs from given did blockchain network ${did.blockchain}`
      );
    }
    return did;
  }

  static newDID(didStr: string, ...args: DIDOptions[]): DID {
    const did = new DID();
    did.id = Id.fromString(didStr);
    args.filter((opt) => !!opt).forEach((arg) => arg(did));
    return did;
  }
}

import {
  Blockchain,
  Constants,
  DidMethodByte,
  DidMethodNetwork,
  DidMethod,
  NetworkId
} from '../constants';

// DIDNetworkFlag is a structure to represent DID blockchain and network id
export class DIDNetworkFlag {
  constructor(public readonly blockchain: Blockchain, public readonly networkId: NetworkId) {}

  toString(): string {
    return `${this.blockchain}:${this.networkId}`;
  }

  static fromString(s: string): DIDNetworkFlag {
    const [blockchain, networkId] = s.split(':');
    return new DIDNetworkFlag(
      blockchain.replace('_', '') as Blockchain,
      networkId.replace('_', '') as NetworkId
    );
  }
}

// BuildDIDType builds bytes type from chain and network
export function buildDIDType(
  method: DidMethod,
  blockchain: Blockchain,
  network: NetworkId
): Uint8Array {
  const fb = DidMethodByte[method];
  if (!fb) {
    throw Constants.ERRORS.UNSUPPORTED_DID_METHOD;
  }
  const methodFn = DidMethodNetwork[method];
  if (!methodFn) {
    throw Constants.ERRORS.NETWORK_NOT_SUPPORTED_FOR_DID;
  }

  const sb: number | undefined = methodFn[new DIDNetworkFlag(blockchain, network).toString()];

  if (typeof sb !== 'number') {
    throw new Error(
      `blockchain ${blockchain.toString() ?? '-'} and network ${
        network.toString() ?? '-'
      } is not defined in core lib`
    );
  }

  return Uint8Array.from([fb, sb]);
}

// FindNetworkIDForDIDMethodByValue finds network by byte value
export function findNetworkIDForDIDMethodByValue(method: DidMethod, byteNumber: number): NetworkId {
  const methodMap = DidMethodNetwork[method];
  if (!methodMap) {
    throw Constants.ERRORS.UNSUPPORTED_DID_METHOD;
  }
  for (const [key, value] of Object.entries(methodMap)) {
    if (value === byteNumber) {
      return DIDNetworkFlag.fromString(key).networkId;
    }
  }
  throw Constants.ERRORS.NETWORK_NOT_SUPPORTED_FOR_DID;
}

// findBlockchainForDIDMethodByValue finds blockchain type by byte value
export function findBlockchainForDIDMethodByValue(
  method: DidMethod,
  byteNumber: number
): Blockchain {
  const methodMap = DidMethodNetwork[method];
  if (!methodMap) {
    throw new Error(
      `${Constants.ERRORS.NETWORK_NOT_SUPPORTED_FOR_DID}: did method ${method} is not defined in core lib`
    );
  }
  for (const [key, value] of Object.entries(methodMap)) {
    if (value === byteNumber) {
      return DIDNetworkFlag.fromString(key).blockchain;
    }
  }
  throw Constants.ERRORS.UNSUPPORTED_BLOCKCHAIN_FOR_DID;
}

// findDIDMethodByValue finds did method by its byte value
export function findDIDMethodByValue(byteNumber: number): DidMethod {
  for (const [key, value] of Object.entries(DidMethodByte)) {
    if (value === byteNumber) {
      return key as DidMethod;
    }
  }
  throw Constants.ERRORS.UNSUPPORTED_DID_METHOD;
}

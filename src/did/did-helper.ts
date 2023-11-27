import {
  BlockChainName,
  Constants,
  DidMethodByte,
  DidMethodName,
  DidMethodNetwork,
  NetworkName
} from '../constants';

// DIDNetworkFlag is a structure to represent DID blockchain and network id
export class DIDNetworkFlag {
  constructor(public readonly blockchain: BlockChainName, public readonly networkId: NetworkName) {}

  toString(): string {
    return `${this.blockchain}:${this.networkId}`;
  }

  static fromString(s: string): DIDNetworkFlag {
    const [blockchain, networkId] = s.split(':');
    return new DIDNetworkFlag(blockchain.replace('_', ''), networkId.replace('_', ''));
  }
}

// BuildDIDType builds bytes type from chain and network
export function buildDIDType(method: string, blockchain: string, network: string): Uint8Array {
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
export function findNetworkIDForDIDMethodByValue(
  method: DidMethodName,
  byteNumber: number
): NetworkName {
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
  method: DidMethodName,
  byteNumber: number
): BlockChainName {
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
export function findDIDMethodByValue(byteNumber: number): DidMethodName {
  for (const [key, value] of Object.entries(DidMethodByte)) {
    if (value === byteNumber) {
      return key;
    }
  }
  throw Constants.ERRORS.UNSUPPORTED_DID_METHOD;
}

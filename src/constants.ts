export const Constants = Object.freeze({
  ERRORS: {
    // ErrDataOverflow means that given *big.Int value does not fit in Field Q
    // e.g. greater than Q constant:
    // Q constant: 21888242871839275222246405745257275088548364400416034343698204186575808495617
    DATA_OVERFLOW: new Error('data does not fits SNARK size'),
    // ErrIncorrectIDPosition means that passed position is not one of predefined:
    // IDPositionIndex or IDPositionValue
    INCORRECT_ID_POSITION: new Error('incorrect ID position'),
    // throws when ID not found in the Claim.
    NO_ID: new Error('ID is not set'),
    // throws when subject position flags sets in invalid value.
    INVALID_SUBJECT_POSITION: new Error('invalid subject position'),
    // ErrIncorrectMerklizePosition means that passed position is not one of predefined:
    // MerklizePositionIndex or MerklizePositionValue
    INCORRECT_MERKLIZED_POSITION: new Error('incorrect Merklize position'),
    // ErrNoMerklizedRoot returns when Merklized Root is not found in the Claim.
    NO_MERKLIZED_ROOT: new Error('Merklized root is not set'),
    NETWORK_NOT_SUPPORTED_FOR_DID: new Error('network in not supported for did'),
    UNSUPPORTED_BLOCKCHAIN_FOR_DID: new Error('not supported blockchain for did'),
    UNSUPPORTED_DID_METHOD: new Error('not supported DID method'),
    UNKNOWN_DID_METHOD: new Error('unknown DID method'),
    INCORRECT_DID: new Error('incorrect DID'),
    UNSUPPORTED_ID: new Error('unsupported Id')
  },
  SCHEMA: {
    HASH_LENGTH: 16
  },
  ETH_ADDRESS_LENGTH: 20,
  BYTES_LENGTH: 32,
  ELEM_BYTES_LENGTH: 4,
  NONCE_BYTES_LENGTH: 8,
  Q: BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617'),
  ID: {
    TYPE_DEFAULT: Uint8Array.from([0x00, 0x00]),
    TYPE_READONLY: Uint8Array.from([0b00000000, 0b00000001]),
    ID_LENGTH: 31
  },
  DID: {
    DID_SCHEMA: 'did'
  },
  GENESIS_LENGTH: 27
});

export const Blockchain: { [k: string]: string } = {
  Ethereum: 'eth',
  Polygon: 'polygon',
  ZkEVM: 'zkevm',
  Unknown: 'unknown',
  NoChain: '',
  ReadOnly: 'readonly'
};

export const NetworkId: { [k: string]: string } = {
  Main: 'main',
  Mumbai: 'mumbai',
  Amoy: 'amoy',
  Goerli: 'goerli',
  Sepolia: 'sepolia',
  Test: 'test',
  Unknown: 'unknown',
  NoNetwork: ''
};

export const DidMethod: { [k: string]: string } = {
  Iden3: 'iden3',
  PolygonId: 'polygonid',
  Other: ''
};

/**
 * Object containing chain IDs for various blockchains and networks.
 * @type { [key: string]: number }
 */
export const ChainIds: { [key: string]: number } = {
  [`${Blockchain.Ethereum}:${NetworkId.Main}`]: 1,
  [`${Blockchain.Ethereum}:${NetworkId.Goerli}`]: 5,
  [`${Blockchain.Ethereum}:${NetworkId.Sepolia}`]: 11155111,
  [`${Blockchain.Polygon}:${NetworkId.Main}`]: 137,
  [`${Blockchain.Polygon}:${NetworkId.Mumbai}`]: 80001,
  [`${Blockchain.Polygon}:${NetworkId.Amoy}`]: 80002,
  [`${Blockchain.ZkEVM}:${NetworkId.Main}`]: 1101,
  [`${Blockchain.ZkEVM}:${NetworkId.Test}`]: 1442
};

export const DidMethodByte: { [key: string]: number } = {
  [DidMethod.Iden3]: 0b00000001,
  [DidMethod.PolygonId]: 0b00000010,
  [DidMethod.Other]: 0b11111111
};

const blockchainNetworkMap = {
  [`${Blockchain.ReadOnly}:${NetworkId.NoNetwork}`]: 0b00000000,
  [`${Blockchain.Polygon}:${NetworkId.Main}`]: 0b0001_0000 | 0b0000_0001,
  [`${Blockchain.Polygon}:${NetworkId.Mumbai}`]: 0b0001_0000 | 0b0000_0010,
  [`${Blockchain.Polygon}:${NetworkId.Amoy}`]: 0b0001_0000 | 0b0000_0011,
  [`${Blockchain.Ethereum}:${NetworkId.Main}`]: 0b0010_0000 | 0b0000_0001,
  [`${Blockchain.Ethereum}:${NetworkId.Goerli}`]: 0b0010_0000 | 0b0000_0010,
  [`${Blockchain.Ethereum}:${NetworkId.Sepolia}`]: 0b0010_0000 | 0b0000_0011,
  [`${Blockchain.ZkEVM}:${NetworkId.Main}`]: 0b0011_0000 | 0b0000_0001,
  [`${Blockchain.ZkEVM}:${NetworkId.Test}`]: 0b0011_0000 | 0b0000_0010
};

// DIDMethodNetwork is map for did methods and their blockchain networks
export const DidMethodNetwork: {
  [k: string]: { [k: string]: number };
} = {
  [DidMethod.Iden3]: {
    ...blockchainNetworkMap
  },
  [DidMethod.PolygonId]: {
    ...blockchainNetworkMap
  },
  [DidMethod.Other]: {
    [`${Blockchain.Unknown}:${NetworkId.Unknown}`]: 0b1111_1111
  }
};

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

export type BlockChainName = 'eth' | 'polygon' | 'zkevm' | 'unknown' | 'readonly' | '' | string;

export const Blockchain: { [k: BlockChainName]: string } = {
  Ethereum: 'eth',
  Polygon: 'polygon',
  ZkEVM: 'zkevm',
  Unknown: 'unknown',
  NoChain: '',
  ReadOnly: 'readonly'
};

export const registerBlockchain = (
  name: BlockChainName,
  value: BlockChainName | null = null
): void => {
  if (Blockchain[name]) {
    throw new Error(`blockchain ${name} already registered`);
  }
  Blockchain[name] = value ?? name;
};

export type NetworkName =
  | 'main'
  | 'mumbai'
  | 'goerli'
  | 'sepolia'
  | 'test'
  | 'unknown'
  | ''
  | string;

export const NetworkId: { [k: NetworkName]: NetworkName } = {
  Main: 'main',
  Mumbai: 'mumbai',
  Goerli: 'goerli',
  Sepolia: 'sepolia',
  Test: 'test',
  Unknown: 'unknown',
  NoNetwork: ''
};

export const registerNetworkId = (name: NetworkName, value: NetworkName | null = null): void => {
  if (NetworkId[name]) {
    throw new Error(`network ${name} already registered`);
  }
  NetworkId[name] = value ?? name;
};

export type DidMethodName = 'iden3' | 'polygonid' | '' | string;

export const DidMethod: { [k: DidMethodName]: DidMethodName } = {
  Iden3: 'iden3',
  PolygonId: 'polygonid',
  Other: ''
};

export const registerDidMethod = (
  name: DidMethodName,
  value: DidMethodName | null = null
): void => {
  if (DidMethod[name]) {
    throw new Error(`did method ${name} already registered`);
  }
  DidMethod[name] = value ?? name;
};

export const DidMethodByte: { [key: DidMethodName]: number } = {
  [DidMethod.Iden3]: 0b00000001,
  [DidMethod.PolygonId]: 0b00000010,
  [DidMethod.Other]: 0b11111111
};

export const registerDidMethodByte = (name: DidMethodName, value: number): void => {
  if (!DidMethod[name]) {
    throw new Error(`did method ${name} not registered`);
  }
  if (DidMethodByte[name]) {
    throw new Error(`did method byte ${name} already registered`);
  }
  DidMethodByte[name] = value;
};

// DIDMethodNetwork is map for did methods and their blockchain networks
export const DidMethodNetwork: {
  [k: DidMethodName]: { [k: string]: number };
} = {
  [DidMethod.Iden3]: {
    [`${Blockchain.ReadOnly}:${NetworkId.NoNetwork}`]: 0b00000000,
    [`${Blockchain.Polygon}:${NetworkId.Main}`]: 0b00010000 | 0b00000001,
    [`${Blockchain.Polygon}:${NetworkId.Mumbai}`]: 0b00010000 | 0b00000010,
    [`${Blockchain.Ethereum}:${NetworkId.Main}`]: 0b00100000 | 0b00000001,
    [`${Blockchain.Ethereum}:${NetworkId.Goerli}`]: 0b00100000 | 0b00000010,
    [`${Blockchain.Ethereum}:${NetworkId.Sepolia}`]: 0b00100000 | 0b00000011,
    [`${Blockchain.ZkEVM}:${NetworkId.Main}`]: 0b00110000 | 0b00000001,
    [`${Blockchain.ZkEVM}:${NetworkId.Test}`]: 0b00110000 | 0b00000010
  },
  [DidMethod.PolygonId]: {
    [`${Blockchain.ReadOnly}:${NetworkId.NoNetwork}`]: 0b00000000,
    [`${Blockchain.Polygon}:${NetworkId.Main}`]: 0b00010000 | 0b00000001,
    [`${Blockchain.Polygon}:${NetworkId.Mumbai}`]: 0b00010000 | 0b00000010,
    [`${Blockchain.Ethereum}:${NetworkId.Main}`]: 0b00100000 | 0b00000001,
    [`${Blockchain.Ethereum}:${NetworkId.Goerli}`]: 0b00100000 | 0b00000010,
    [`${Blockchain.Ethereum}:${NetworkId.Sepolia}`]: 0b00100000 | 0b00000011,
    [`${Blockchain.ZkEVM}:${NetworkId.Main}`]: 0b00110000 | 0b00000001,
    [`${Blockchain.ZkEVM}:${NetworkId.Test}`]: 0b00110000 | 0b00000010
  },
  [DidMethod.Other]: {
    [`${Blockchain.Unknown}:${NetworkId.Unknown}`]: 0b11111111
  }
};

export const registerDidMethodNetwork = (
  method: DidMethodName,
  blockchain: BlockChainName,
  network: NetworkName,
  networkFlag: number
): void => {
  if (!DidMethod[method]) {
    throw new Error(`did method ${method} not registered`);
  }

  if (!Blockchain[blockchain]) {
    throw new Error(`blockchain ${blockchain} not registered`);
  }

  if (!NetworkId[network]) {
    throw new Error(`network ${network} not registered`);
  }

  if (!DidMethodNetwork[method]) {
    DidMethodNetwork[method] = {};
  }
  const key = `${blockchain}:${network}`;
  if (DidMethodNetwork[method][key]) {
    throw new Error(`did method network ${key} already registered`);
  }
  DidMethodNetwork[method][key] = networkFlag;
};

export const registerDidMethodNetworkForce = (
  method: string,
  blockchain: string,
  network: string
): void => {
  if (!DidMethod[method]) {
    DidMethod[method] = method;
  }

  if (typeof DidMethodByte[method] !== 'number') {
    const methodBytes = Object.values(DidMethodByte).sort((sm, big) => big - sm);
    // take second of methodBytes because max byte is occupied by [DidMethod.Other]: 0b11111111
    DidMethodByte[method] = methodBytes[1] + 0b1;
    if (DidMethodByte[method] > 0b11111111) {
      throw new Error(`did method byte ${method} already registered`);
    }
  }

  if (!Blockchain[blockchain]) {
    Blockchain[blockchain] = blockchain;
  }

  if (!NetworkId[network]) {
    NetworkId[network] = network;
  }

  if (!DidMethodNetwork[method]) {
    DidMethodNetwork[method] = {};
  }
  const key = `${blockchain}:${network}`;
  const networkFlag = DidMethodNetwork[method][key];
  if (typeof networkFlag === 'number') {
    throw new Error(`did method network ${key} already registered`);
  }
  // get the biggest network flag
  const biggestFlag = Object.values(DidMethodNetwork[method]).sort((sm, big) => big - sm)[0];
  if (typeof biggestFlag !== 'number') {
    DidMethodNetwork[method][key] = 0b00010000 | 0b00000001;
  } else {
    //get binary representation of biggest flag
    const biggestFlagBinary = biggestFlag.toString(2).padStart(8, '0');
    const chainPart = parseInt(biggestFlagBinary.slice(0, 4), 2) + 1;
    const networkPart = parseInt(biggestFlagBinary.slice(4), 2) + 1;
    if (chainPart > 0b1111) {
      throw new Error(`Reached max number of blockchains for did method ${method}`);
    }
    if (networkPart > 0b1111) {
      throw new Error(`Reached max number of networks for did method ${method}`);
    }
    DidMethodNetwork[method][key] = (chainPart << 4) | networkPart;
  }
};

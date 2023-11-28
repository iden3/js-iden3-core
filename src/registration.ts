import {
  Blockchain,
  BlockchainName,
  DidMethod,
  DidMethodByte,
  DidMethodName,
  DidMethodNetwork,
  NetworkId,
  NetworkName
} from './constants';

export const registerBlockchain = (chain: BlockchainName): void => {
  if (Object.values(Blockchain).includes(chain)) {
    throw new Error(`blockchain ${chain} already registered`);
  }
  Blockchain[chain] = chain;
};

export const registerDidMethodWithByte = (method: DidMethodName, byte: number): void => {
  if (Object.values(DidMethod).includes(method)) {
    throw new Error(`did method ${method} already registered`);
  }
  DidMethod[method] = method;
  if (DidMethodByte[method]) {
    throw new Error(`did method byte ${method} already registered`);
  }
  DidMethodByte[method] = byte;
};

export const registerNetworkId = (network: NetworkName): void => {
  if (Object.values(NetworkId).includes(network)) {
    throw new Error(`network ${network} already registered`);
  }
  NetworkId[network] = network;
};

export const registerDidMethodNetwork = (
  method: DidMethodName,
  blockchain: BlockchainName,
  network: NetworkName,
  networkFlag: number
): void => {
  if (!Object.values(DidMethod).includes(method)) {
    throw new Error(`did method ${method} not registered`);
  }

  if (!Object.values(Blockchain).includes(blockchain)) {
    throw new Error(`blockchain ${blockchain} not registered`);
  }

  if (!Object.values(NetworkId).includes(network)) {
    throw new Error(`network ${network} not registered`);
  }

  if (typeof DidMethodByte[method] !== 'number') {
    throw new Error(`did method byte for ${method} is not registered`);
  }

  if (!DidMethodNetwork[method]) {
    DidMethodNetwork[method] = {};
  }

  const key = `${blockchain}:${network}`;
  if (typeof DidMethodNetwork[method][key] === 'number') {
    throw new Error(`did method network ${key} already registered`);
  }
  DidMethodNetwork[method][key] = networkFlag;
};

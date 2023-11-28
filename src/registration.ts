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
  if (Blockchain[chain]) {
    throw new Error(`blockchain ${chain} already registered`);
  }
  Blockchain[chain] = chain;
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

export const registerDidMethod = (method: DidMethodName): void => {
  if (DidMethod[method]) {
    throw new Error(`did method ${method} already registered`);
  }
  DidMethod[method] = method;
};

export const registerNetworkId = (name: NetworkName): void => {
  if (NetworkId[name]) {
    throw new Error(`network ${name} already registered`);
  }
  NetworkId[name] = name;
};

export const registerDidMethodNetwork = (
  method: DidMethodName,
  blockchain: BlockchainName,
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

export const registerDidMethodNetworkImplicit = (
  method: DidMethodName,
  blockchain: BlockchainName,
  network: NetworkName
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
  const flags = Object.values(DidMethodNetwork[method]);
  if (!flags.length) {
    DidMethodNetwork[method][key] = 0b00010000 | 0b00000001;
    return;
  }
  //get binary representation of biggest flag
  const biggestFlag = flags.sort((sm, big) => big - sm)[0];
  const chainPart = (biggestFlag >> 4) + 1;
  const networkPart = (biggestFlag & 0b0000_1111) + 1;

  if (chainPart >= 0b1111) {
    throw new Error(`Reached max number of blockchains for did method ${method}`);
  }

  if (networkPart >= 0b1111) {
    throw new Error(`Reached max number of networks for did method ${method}`);
  }

  DidMethodNetwork[method][key] = (chainPart << 4) | networkPart;
};

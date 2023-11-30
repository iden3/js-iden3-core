import {
  Blockchain,
  BlockchainName,
  ChainIds,
  DidMethod,
  DidMethodByte,
  DidMethodName,
  DidMethodNetwork,
  NetworkId,
  NetworkName
} from './constants';

const registerDidMethodWithByte = (method: DidMethodName, byte?: number): void => {
  DidMethod[method] = method;
  if (typeof byte !== 'number') {
    return;
  }

  if (typeof DidMethodByte[method] === 'number') {
    throw new Error(`did method byte ${method} already registered`);
  }

  DidMethodByte[method] = byte;
};

const registerChainId = (blockchain: string, network: string, chainId?: number): void => {
  if (!chainId) {
    return;
  }

  if (network) {
    blockchain += `:${network}`;
  }

  ChainIds[blockchain] = chainId;
};

export const getChainId = (blockchain: string, network?: string): number => {
  if (network) {
    blockchain += `:${network}`;
  }
  const chainId = ChainIds[blockchain];
  if (!chainId) {
    throw new Error(`chainId not found for ${blockchain}`);
  }
  return chainId;
};

export const registerDidMethodNetwork = ({
  method,
  methodByte,
  blockchain,
  network,
  chainId,
  networkFlag
}: {
  method: DidMethodName;
  methodByte?: number;
  blockchain: BlockchainName;
  network: NetworkName;
  networkFlag: number;
  chainId?: number;
}): void => {
  Blockchain[blockchain] = blockchain;
  NetworkId[network] = network;
  registerDidMethodWithByte(method, methodByte);

  if (!DidMethodNetwork[method]) {
    DidMethodNetwork[method] = {};
  }

  registerChainId(blockchain, network, chainId);

  const key = `${blockchain}:${network}`;
  if (typeof DidMethodNetwork[method][key] === 'number') {
    throw new Error(`did method network ${key} already registered`);
  }
  DidMethodNetwork[method][key] = networkFlag;
};

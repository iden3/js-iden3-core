import {
  Blockchain,
  ChainIds,
  DidMethod,
  DidMethodByte,
  DidMethodNetwork,
  NetworkId
} from './constants';
import { DID } from './did';

export const registerBlockchain = (blockchain: string): void => {
  Blockchain[blockchain] = blockchain;
};

export const registerNetwork = (network: string): void => {
  NetworkId[network] = network;
};

export const registerDidMethod = (method: string, byte: number): void => {
  if (Object.values(DidMethodByte).includes(byte) && DidMethodByte[method] !== byte) {
    throw new Error(
      `can't register method '${method}' because DID method byte '${byte.toString(
        2
      )}' already registered`
    );
  }
  const max = DidMethodByte[DidMethod.Other];

  if (byte >= max) {
    throw new Error(
      `Can't register DID method byte: current '${byte.toString(2)}', maximum byte allowed: '${(
        max - 1
      ).toString(2)}'`
    );
  }

  DidMethod[method] = method;
  DidMethodByte[method] = byte;
};

/**
 * Register chain ID for a blockchain and network.
 *
 * @param {string} blockchain
 * @param {string} network
 * @param {number} [chainId]
 * @returns {void}
 */
export const registerChainId = (blockchain: string, network: string, chainId: number): void => {
  const key = `${blockchain}:${network}`;
  const isNotSameValue = typeof ChainIds[key] === 'number' && ChainIds[key] !== chainId;
  const isValueAlreadyExists = Object.values(ChainIds).includes(chainId);

  if (isValueAlreadyExists && isNotSameValue) {
    throw new Error(
      `chainId '${blockchain}:${network}' already registered with value '${ChainIds[key]}'`
    );
  }

  ChainIds[key] = chainId;
};

/**
 * Get chain ID by a blockchain and network.
 *
 * @param {string} blockchain
 * @param {string} [network]
 * @returns {number}
 */
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

/**
 * ChainIDfromDID returns chain name from w3c.DID
 *
 * @param {DID} did
 * @returns {number}
 */
export const chainIDfromDID = (did: DID): number => {
  const id = DID.idFromDID(did);

  const blockchain = DID.blockchainFromId(id);

  const networkId = DID.networkIdFromId(id);

  const chainId = ChainIds[`${blockchain}:${networkId}`];
  if (typeof chainId !== 'number') {
    throw new Error(`chainId not found for ${blockchain}:${networkId}`);
  }

  return chainId;
};

/**
 * Register a DID method with a byte value.
 * https://docs.iden3.io/getting-started/identity/identity-types/#regular-identity
 * @param {{
 *   method: DidMethodName;  DID method name
 *   methodByte?: number; put DID method byte value in case you want to register new DID method
 *   blockchain: BlockchainName;  blockchain name
 *   network: NetworkName;  network name
 *   networkFlag: number;  network flag
 *   chainId?: number;  put  chain ID in case you need to use it
 * }} {
 *   method,
 *   methodByte,
 *   blockchain,
 *   network,
 *   chainId,
 *   networkFlag
 * }
 */
export const registerDidMethodNetwork = ({
  method,
  methodByte,
  blockchain,
  network,
  chainId,
  networkFlag
}: {
  method: string;
  methodByte?: number;
  blockchain: string;
  network: string;
  networkFlag: number;
  chainId?: number;
}): void => {
  registerBlockchain(blockchain);
  registerNetwork(network);
  if (typeof methodByte === 'number') {
    registerDidMethod(method, methodByte);
  }

  if (!DidMethodNetwork[method]) {
    DidMethodNetwork[method] = {};
  }

  if (typeof chainId === 'number') {
    registerChainId(blockchain, network, chainId);
  }

  const key = `${blockchain}:${network}`;

  const existedFlag = DidMethodNetwork[method][key];
  if (typeof existedFlag === 'number' && existedFlag !== networkFlag) {
    throw new Error(
      `DID method network '${method}' with blockchain '${blockchain}' and network '${network}' already registered with another flag '${existedFlag.toString(
        2
      )}'`
    );
  }

  if (Object.values(DidMethodNetwork[method]).includes(networkFlag)) {
    throw new Error(`DID network flag  ${DidMethodNetwork[method][key]} is already registered`);
  }
  DidMethodNetwork[method][key] = networkFlag;
};

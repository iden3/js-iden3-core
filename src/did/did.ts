import { Id } from '../id';
import {
  Blockchain,
  Constants,
  DidMethodByte,
  DidMethodNetwork,
  DidMethod,
  NetworkId
} from '../constants';
import { BytesHelper } from '../elemBytes';
import {
  DIDNetworkFlag,
  findBlockchainForDIDMethodByValue,
  findDIDMethodByValue,
  findNetworkIDForDIDMethodByValue
} from './did-helper';
import { Parser } from './did-parser';
import { IDID, Param } from './types';
import { sha256 } from 'cross-sha256';

// DID Decentralized Identifiers (DIDs)
// https://w3c.github.io/did-core/#did-syntax
export class DID {
  method = '';
  id = '';
  idStrings: string[] = [];
  params: Param[] = [];
  path = '';
  pathSegments: string[] = [];
  query = '';
  fragment = '';

  constructor(d?: Partial<IDID>) {
    if (d) {
      Object.assign(this, d);
    }
  }

  isUrl(): boolean {
    return (
      this.params.length > 0 ||
      !!this.path ||
      this.pathSegments.length > 0 ||
      !!this.query ||
      !!this.fragment
    );
  }

  string(): string {
    const buff = ['did:'];
    if (this.method) {
      buff.push(`${this.method}:`);
    } else {
      return '';
    }

    if (this.id) {
      buff.push(this.id);
    } else if (this.idStrings.length) {
      buff.push(this.idStrings.join(':'));
    } else {
      return '';
    }

    if (this.params.length) {
      for (const param of this.params) {
        const p = param.toString();
        if (p) {
          buff.push(`;${p}`);
        } else {
          return '';
        }
      }
    }

    if (this.path) {
      buff.push(`/${this.path}`);
    } else if (this.pathSegments.length) {
      buff.push(`/${this.pathSegments.join('/')}`);
    }

    if (this.query) {
      buff.push(`?${this.query}`);
    }

    if (this.fragment) {
      buff.push(`#${this.fragment}`);
    }

    return buff.join('');
  }

  static parse(s: string): DID {
    const parser = new Parser(s);

    let parserState = parser.checkLength();

    while (parserState) {
      parserState = parserState();
    }

    parser.out.id = parser.out.idStrings.join(':');
    parser.out.path = parser.out.pathSegments.join('/');

    return new DID(parser.out);
  }

  static decodePartsFromId(id: Id): {
    method: DidMethod;
    blockchain: Blockchain | string;
    networkId: NetworkId | string;
  } {
    const method = findDIDMethodByValue(id.bytes[0]);
    const blockchain = findBlockchainForDIDMethodByValue(method, id.bytes[1]);

    const networkId = findNetworkIDForDIDMethodByValue(method, id.bytes[1]);

    return { method, blockchain, networkId };
  }

  static networkIdFromId(id: Id): NetworkId | string {
    return DID.throwIfDIDUnsupported(id).networkId;
  }

  static methodFromId(id: Id): DidMethod {
    return DID.throwIfDIDUnsupported(id).method;
  }

  static blockchainFromId(id: Id): Blockchain | string {
    return DID.throwIfDIDUnsupported(id).blockchain;
  }

  private static throwIfDIDUnsupported(id: Id): {
    method: DidMethod;
    blockchain: Blockchain | string;
    networkId: NetworkId | string;
  } {
    const { method, blockchain, networkId } = DID.decodePartsFromId(id);

    if (DID.isUnsupported(method, blockchain, networkId)) {
      throw new Error(`${Constants.ERRORS.UNKNOWN_DID_METHOD.message}: unsupported DID`);
    }

    return { method, blockchain, networkId };
  }

  // DIDGenesisFromIdenState calculates the genesis ID from an Identity State and returns it as DID
  static newFromIdenState(typ: Uint8Array, state: bigint): DID {
    const id = Id.idGenesisFromIdenState(typ, state);

    return DID.parseFromId(id);
  }

  // NewDID creates a new *w3c.DID from the type and the genesis
  static new(typ: Uint8Array, genesis: Uint8Array): DID {
    return DID.parseFromId(new Id(typ, genesis));
  }

  // ParseDIDFromID returns DID from ID
  static parseFromId(id: Id): DID {
    if (!BytesHelper.checkChecksum(id.bytes)) {
      throw new Error(`${Constants.ERRORS.UNSUPPORTED_ID.message}: invalid checksum`);
    }
    const { method, blockchain, networkId } = DID.throwIfDIDUnsupported(id);

    const didParts = [Constants.DID.DID_SCHEMA, method.toString(), blockchain.toString()];
    if (networkId) {
      didParts.push(networkId.toString());
    }
    didParts.push(id.string());

    const didString = didParts.join(':');

    const did = DID.parse(didString);

    return did;
  }

  static idFromDID(did: DID): Id {
    let id: Id;
    try {
      id = DID.getIdFromDID(did);
    } catch (error) {
      if ((error as Error).message === Constants.ERRORS.UNKNOWN_DID_METHOD.message) {
        return DID.idFromUnsupportedDID(did);
      }
      throw error;
    }

    return id;
  }

  static isUnsupported(
    method: DidMethod,
    blockchain: Blockchain | string,
    networkId: NetworkId | string
  ): boolean {
    return (
      method == DidMethod.Other &&
      blockchain == Blockchain.Unknown &&
      networkId == NetworkId.Unknown
    );
  }

  static idFromUnsupportedDID(did: DID): Id {
    const hash = Uint8Array.from(new sha256().update(did.string()).digest());

    const genesis = new Uint8Array(27);
    const idSlice = hash.slice(hash.length - Constants.GENESIS_LENGTH);
    for (let i = 0; i < genesis.length; i++) {
      genesis[i] = idSlice[i] ?? 0;
    }
    const flg = new DIDNetworkFlag(Blockchain.Unknown, NetworkId.Unknown);
    const tp = Uint8Array.from([
      DidMethodByte[DidMethod.Other],
      DidMethodNetwork[DidMethod.Other][flg.toString()]
    ]);
    return new Id(tp, genesis);
  }

  private static getIdFromDID(did: DID): Id {
    const method = did.method;
    const methodByte = DidMethodByte[method];
    if (!methodByte || method === DidMethod.Other) {
      throw Constants.ERRORS.UNKNOWN_DID_METHOD;
    }

    if (did.idStrings.length > 3 || did.idStrings.length < 2) {
      throw new Error(`${Constants.ERRORS.INCORRECT_DID}: unexpected number of ID strings`);
    }

    const id = Id.fromString(did.idStrings[did.idStrings.length - 1]);

    if (!BytesHelper.checkChecksum(id.bytes)) {
      throw new Error(`${Constants.ERRORS.INCORRECT_DID}: incorrect ID checksum`);
    }

    const { method: method2, blockchain, networkId } = DID.decodePartsFromId(id);

    if (method2.toString() !== method.toString()) {
      throw new Error(`${Constants.ERRORS.INCORRECT_DID}: methods in Id and DID are different`);
    }

    if (blockchain.toString() !== did.idStrings[0]) {
      throw new Error(`${Constants.ERRORS.INCORRECT_DID}: blockchains in ID and DID are different`);
    }

    if (did.idStrings.length > 2 && networkId.toString() != did.idStrings[1]) {
      throw new Error(`${Constants.ERRORS.INCORRECT_DID}: networkIDs in Id and DID are different`);
    }

    return id;
  }
}

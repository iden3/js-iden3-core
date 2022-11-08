export const Constants = Object.freeze({
  ERRORS: {
    // ErrDataOverflow means that given *big.Int value does not fit in Field Q
    // e.g. greater than Q constant:
    // Q constant: 21888242871839275222246405745257275088548364400416034343698204186575808495617
    DATA_OVERFLOW: 'data does not fits SNARK size',
    // ErrIncorrectIDPosition means that passed position is not one of predefined:
    // IDPositionIndex or IDPositionValue
    INCORRECT_ID_POSITION: 'incorrect ID position',
    // throws when ID not found in the Claim.
    NO_ID: 'ID is not set',
    // throws when subject position flags sets in invalid value.
    INVALID_SUBJECT_POSITION: 'invalid subject position',
    // ErrIncorrectMerklizePosition means that passed position is not one of predefined:
    // MerklizePositionIndex or MerklizePositionValue
    INCORRECT_MERKLIZED_POSITION: 'incorrect Merklize position'
  },
  SCHEMA: {
    HASH_LENGTH: 16
  },
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
    DID_SCHEMA: 'did',
    DID_METHOD_IDEN3: 'iden3'
  }
});

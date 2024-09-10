import { IDID, Param, initDIDParams } from './types';
import { StringUtils } from '../utils';

// a step in the parser state machine that returns the next step
type ParserStep = () => ParserStep | null;

export class Parser {
  currentIndex = 0; // index in the input which the parser is currently processing:
  out: IDID = { ...initDIDParams }; // the output DID that the parser will assemble as it steps through its state machine  // an error in the parser state machine

  constructor(private readonly input: string) {}

  checkLength(): ParserStep | null {
    const inputLength = this.input.length;

    if (inputLength < 7) {
      throw new Error('input length is less than 7');
    }

    return this.parseScheme.bind(this);
  }

  // parseScheme is a parserStep that validates that the input begins with 'did:'
  parseScheme(): ParserStep | null {
    const currentIndex = 3; // 4 bytes in 'did:', i.e index 3
    // the grammar requires `did:` prefix
    if (this.input.slice(0, currentIndex + 1) !== 'did:') {
      throw new Error("input does not begin with 'did:' prefix");
    }

    this.currentIndex = currentIndex;
    return this.parseMethod.bind(this);
  }

  parseMethod(): ParserStep | null {
    const input = this.input;
    const inputLength = input.length;
    let currentIndex = this.currentIndex + 1;
    const startIndex = currentIndex;

    for (;;) {
      if (currentIndex === inputLength) {
        // we got to the end of the input and didn't find a second ':'
        throw new Error('input does not have a second `:` marking end of method name');
      }

      // read the input character at currentIndex
      const char = input[currentIndex];

      if (char === ':') {
        // we've found the second : in the input that marks the end of the method
        if (currentIndex === startIndex) {
          // return error is method is empty, ex- did::1234
          throw new Error(`method is empty, ${currentIndex}`);
        }
        break;
      }

      // as per the grammar method can only be made of digits 0-9 or small letters a-z
      if (StringUtils.isNotDigit(char) && StringUtils.isNotSmallLetter(char)) {
        throw new Error(`"character is not a-z OR 0-9, ${currentIndex}`);
      }

      // move to the next char
      currentIndex = currentIndex + 1;
    }

    // set parser state
    this.currentIndex = currentIndex;
    this.out.method = input.slice(startIndex, currentIndex);

    // method is followed by specific-idstring, parse that next
    return this.parseId.bind(this);
  }

  parseId(): ParserStep | null {
    const input = this.input;
    const inputLength = input.length;
    let currentIndex = this.currentIndex + 1;
    const startIndex = currentIndex;

    let next: ParserStep | null = null;

    for (;;) {
      if (currentIndex === inputLength) {
        // we've reached end of input, no next state
        next = null;
        break;
      }

      const char = input[currentIndex];

      if (char === ':') {
        // encountered : input may have another idstring, parse ID again
        next = this.parseId;
        break;
      }

      if (char === ';') {
        // encountered ; input may have a parameter, parse that next
        next = this.parseParamName;
        break;
      }

      if (char === '/') {
        // encountered / input may have a path following specific-idstring, parse that next
        next = this.parsePath;
        break;
      }

      if (char === '?') {
        // encountered ? input may have a query following specific-idstring, parse that next
        next = this.parseQuery;
        break;
      }

      if (char === '#') {
        // encountered # input may have a fragment following specific-idstring, parse that next
        next = this.parseFragment;
        break;
      }

      // make sure current char is a valid idchar
      // idchar = ALPHA / DIGIT / "." / "-"
      if (StringUtils.isNotValidIDChar(char)) {
        throw new Error(`byte is not ALPHA OR DIGIT OR '.' OR '-', ${currentIndex}`);
      }

      // move to the next char
      currentIndex = currentIndex + 1;
    }

    if (currentIndex === startIndex) {
      // idstring length is zero
      // from the grammar:
      //   idstring = 1*idchar
      // return error because idstring is empty, ex- did:a::123:456
      throw new Error(`idstring must be at least one char long, ${currentIndex}`);
    }

    // set parser state
    this.currentIndex = currentIndex;
    this.out.idStrings = [...this.out.idStrings, input.slice(startIndex, currentIndex)];

    // return the next parser step
    return next ? next.bind(this) : null;
  }

  parseParamName(): ParserStep | null {
    const input = this.input;
    const startIndex = this.currentIndex + 1;
    const next = this.paramTransition();
    const currentIndex = this.currentIndex;

    if (currentIndex === startIndex) {
      throw new Error(`Param name must be at least one char long, ${currentIndex}`);
    }

    // Create a new param with the name
    this.out.params = [...this.out.params, new Param(input.slice(startIndex, currentIndex), '')];

    // return the next parser step
    return next ? next.bind(this) : null;
  }

  parseParamValue(): ParserStep | null {
    const input = this.input;
    const startIndex = this.currentIndex + 1;
    const next = this.paramTransition();
    const currentIndex = this.currentIndex;
    this.out.params[this.out.params.length - 1].value = input.slice(startIndex, currentIndex);
    return next ? next.bind(this) : null;
  }

  paramTransition(): ParserStep | null {
    const input = this.input;
    const inputLength = input.length;
    let currentIndex = this.currentIndex + 1;

    let indexIncrement: number;
    let next: ParserStep | null;
    let percentEncoded: boolean;

    for (;;) {
      if (currentIndex === inputLength) {
        // we've reached end of input, no next state
        next = null;
        break;
      }

      const char = input[currentIndex];

      if (char === ';') {
        // encountered : input may have another param, parse paramName again
        next = this.parseParamName;
        break;
      }

      // Separate steps for name and value?
      if (char === '=') {
        // parse param value
        next = this.parseParamValue;
        break;
      }

      if (char === '/') {
        // encountered / input may have a path following current param, parse that next
        next = this.parsePath;
        break;
      }

      if (char === '?') {
        // encountered ? input may have a query following current param, parse that next
        next = this.parseQuery;
        break;
      }

      if (char == '#') {
        // encountered # input may have a fragment following current param, parse that next
        next = this.parseFragment;
        break;
      }

      if (char == '%') {
        // a % must be followed by 2 hex digits
        if (
          currentIndex + 2 >= inputLength ||
          StringUtils.isNotHexDigit(input[currentIndex + 1]) ||
          StringUtils.isNotHexDigit(input[currentIndex + 2])
        ) {
          throw new Error(`% is not followed by 2 hex digits', ${currentIndex}`);
        }
        // if we got here, we're dealing with percent encoded char, jump three chars
        percentEncoded = true;
        indexIncrement = 3;
      } else {
        // not percent encoded
        percentEncoded = false;
        indexIncrement = 1;
      }

      // make sure current char is a valid param-char
      // idchar = ALPHA / DIGIT / "." / "-"
      if (!percentEncoded && StringUtils.isNotValidParamChar(char)) {
        throw new Error(`character is not allowed in param - ${char}',  ${currentIndex}`);
      }

      // move to the next char
      currentIndex = currentIndex + indexIncrement;
    }

    // set parser state
    this.currentIndex = currentIndex;

    return next ? next.bind(this) : null;
  }

  parsePath(): ParserStep | null {
    const input = this.input;
    const inputLength = input.length;
    let currentIndex = this.currentIndex + 1;
    const startIndex = currentIndex;

    let indexIncrement: number;
    let next: ParserStep | null;
    let percentEncoded: boolean;

    for (;;) {
      if (currentIndex === inputLength) {
        next = null;
        break;
      }

      const char = input[currentIndex];

      if (char === '/') {
        // encountered / input may have another path segment, try to parse that next
        next = this.parsePath;
        break;
      }

      if (char === '?') {
        // encountered ? input may have a query following path, parse that next
        next = this.parseQuery;
        break;
      }

      if (char === '%') {
        // a % must be followed by 2 hex digits
        if (
          currentIndex + 2 >= inputLength ||
          StringUtils.isNotHexDigit(input[currentIndex + 1]) ||
          StringUtils.isNotHexDigit(input[currentIndex + 2])
        ) {
          throw new Error(`% is not followed by 2 hex digits, ${currentIndex}`);
        }
        // if we got here, we're dealing with percent encoded char, jump three chars
        percentEncoded = true;
        indexIncrement = 3;
      } else {
        // not percent encoded
        percentEncoded = false;
        indexIncrement = 1;
      }

      // pchar = unreserved / pct-encoded / sub-delims / ":" / "@"
      if (!percentEncoded && StringUtils.isNotValidPathChar(char)) {
        throw new Error(`character is not allowed in path, ${currentIndex}`);
      }

      // move to the next char
      currentIndex = currentIndex + indexIncrement;
    }

    if (currentIndex == startIndex && this.out.pathSegments.length === 0) {
      throw new Error(`first path segment must have at least one character, ${currentIndex}`);
    }

    // update parser state
    this.currentIndex = currentIndex;
    this.out.pathSegments = [...this.out.pathSegments, input.slice(startIndex, currentIndex)];

    return next ? next.bind(this) : null;
  }

  parseQuery(): ParserStep | null {
    const input = this.input;
    const inputLength = input.length;
    let currentIndex = this.currentIndex + 1;
    const startIndex = currentIndex;

    let indexIncrement: number;
    let next: ParserStep | null = null;
    let percentEncoded: boolean;

    for (;;) {
      if (currentIndex === inputLength) {
        break;
      }

      const char = input[currentIndex];

      if (char === '#') {
        // encountered # input may have a fragment following the query, parse that next
        next = this.parseFragment;
        break;
      }

      if (char === '%') {
        // a % must be followed by 2 hex digits
        if (
          currentIndex + 2 >= inputLength ||
          StringUtils.isNotHexDigit(input[currentIndex + 1]) ||
          StringUtils.isNotHexDigit(input[currentIndex + 2])
        ) {
          throw new Error(`% is not followed by 2 hex digits, ${currentIndex}`);
        }
        // if we got here, we're dealing with percent encoded char, jump three chars
        percentEncoded = true;
        indexIncrement = 3;
      } else {
        // not percent encoded
        percentEncoded = false;
        indexIncrement = 1;
      }
      if (!percentEncoded && StringUtils.isNotValidQueryOrFragmentChar(char)) {
        throw new Error(`character is not allowed in query - ${char}`);
      }

      // move to the next char
      currentIndex = currentIndex + indexIncrement;
    }

    // update parser state
    this.currentIndex = currentIndex;
    this.out.query = input.slice(startIndex, currentIndex);

    return next ? next.bind(this) : null;
  }

  parseFragment(): ParserStep | null {
    const input = this.input;
    const inputLength = this.input.length;
    let currentIndex = this.currentIndex + 1;
    const startIndex = currentIndex;

    let indexIncrement: number;
    let percentEncoded: boolean;

    for (;;) {
      if (currentIndex === inputLength) {
        break;
      }

      const char = input[currentIndex];

      if (char === '%') {
        // a % must be followed by 2 hex digits
        if (
          currentIndex + 2 >= inputLength ||
          StringUtils.isNotHexDigit(input[currentIndex + 1]) ||
          StringUtils.isNotHexDigit(input[currentIndex + 2])
        ) {
          throw new Error(`% is not followed by 2 hex digits, ${currentIndex}`);
        }
        // if we got here, we're dealing with percent encoded char, jump three chars
        percentEncoded = true;
        indexIncrement = 3;
      } else {
        // not percent encoded
        percentEncoded = false;
        indexIncrement = 1;
      }

      if (!percentEncoded && StringUtils.isNotValidQueryOrFragmentChar(char)) {
        throw new Error(`character is not allowed in fragment - ${char}`);
      }

      // move to the next char
      currentIndex = currentIndex + indexIncrement;
    }

    // update parser state
    this.currentIndex = currentIndex;
    this.out.fragment = input.slice(startIndex, currentIndex);

    // no more parsing needed after a fragment,
    // cause the state machine to exit by returning nil
    return null;
  }
}

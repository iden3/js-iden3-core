import { DID, Param } from '../src/did';
import { StringUtils } from '../src/utils';

describe('DID parser', () => {
  describe('TestisUrl', () => {
    it('returns false if no Path or Fragment', () => {
      const d = new DID({ method: 'example', id: '123' });
      expect(false).toBe(d.isUrl());
    });

    it('returns true if Params', () => {
      const d = new DID({
        method: 'example',
        id: '123',
        params: [new Param('foo', 'bar')]
      });
      expect(true).toBe(d.isUrl());
    });

    it('returns true if Path', () => {
      const d = new DID({ method: 'example', id: '123', path: 'a/b' });
      expect(true).toBe(d.isUrl());
    });

    it('returns true if PathSegments', () => {
      const d = new DID({ method: 'example', id: '123', pathSegments: ['a', 'b'] });
      expect(true).toBe(d.isUrl());
    });

    it('returns true if Query', () => {
      const d = new DID({ method: 'example', id: '123', query: 'abc' });
      expect(true).toBe(d.isUrl());
    });

    it('returns true if Fragment', () => {
      const d = new DID({ method: 'example', id: '123', fragment: '00000' });
      expect(true).toBe(d.isUrl());
    });

    it('returns true if Path and Fragment', () => {
      const d = new DID({ method: 'example', id: '123', path: 'a/b', fragment: '00000' });
      expect(true).toBe(d.isUrl());
    });
  });

  describe('TestString', () => {
    it('assembles a DID', () => {
      const d = new DID({ method: 'example', id: '123' });
      expect('did:example:123').toBe(d.string());
    });

    it('assembles a DID from IDStrings', () => {
      const d = new DID({ method: 'example', idStrings: ['123', '456'] });
      expect('did:example:123:456').toBe(d.string());
    });

    it('returns empty string if no method', () => {
      const d = new DID({ id: '123' });
      expect('').toBe(d.string());
    });

    it('returns empty string in no ID or IDStrings', () => {
      const d = new DID({ method: 'example' });
      expect('').toBe(d.string());
    });

    it('returns empty string if Param name does not exist', () => {
      const d = new DID({
        method: 'example',
        id: '123',
        params: [new Param('', 'agent')]
      });
      expect('').toBe(d.string());
    });

    it('returns name string if Param value does not exist', () => {
      const d = new DID({
        method: 'example',
        id: '123',
        params: [new Param('service', '')]
      });
      expect('did:example:123;service').toBe(d.string());
    });

    it('returns param string with name and value', () => {
      const d = new DID({
        method: 'example',
        id: '123',
        params: [new Param('service', 'agent')]
      });
      expect('did:example:123;service=agent').toBe(d.string());
    });

    it('includes Param generic', () => {
      const d = new DID({
        method: 'example',
        id: '123',
        params: [new Param('service', 'agent')]
      });
      expect('did:example:123;service=agent').toBe(d.string());
    });

    it('includes Param method', () => {
      const d = new DID({
        method: 'example',
        id: '123',
        params: [new Param('foo:bar', 'high')]
      });
      expect('did:example:123;foo:bar=high').toBe(d.string());
    });

    it('includes Param generic and method', () => {
      const d = new DID({
        method: 'example',
        id: '123',
        params: [new Param('service', 'agent'), new Param('foo:bar', 'high')]
      });
      expect('did:example:123;service=agent;foo:bar=high').toBe(d.string());
    });

    it('includes Path', () => {
      const d = new DID({ method: 'example', id: '123', path: 'a/b' });
      expect('did:example:123/a/b').toBe(d.string());
    });

    it('includes Path assembled from PathSegments', () => {
      const d = new DID({ method: 'example', id: '123', pathSegments: ['a', 'b'] });
      expect('did:example:123/a/b').toBe(d.string());
    });

    it('includes Path after Param', () => {
      const d = new DID({
        method: 'example',
        id: '123',
        params: [new Param('service', 'agent')],
        path: 'a/b'
      });
      expect('did:example:123;service=agent/a/b').toBe(d.string());
    });

    it('includes Query after IDString', () => {
      const d = new DID({ method: 'example', id: '123', query: 'abc' });
      expect('did:example:123?abc').toBe(d.string());
    });

    it('include Query after Param', () => {
      const d = new DID({
        method: 'example',
        id: '123',
        query: 'abc',
        params: [new Param('service', 'agent')]
      });
      expect('did:example:123;service=agent?abc').toBe(d.string());
    });

    it('includes Query after Path', () => {
      const d = new DID({ method: 'example', id: '123', path: 'x/y', query: 'abc' });
      expect('did:example:123/x/y?abc').toBe(d.string());
    });

    it('includes Query after Param and Path', () => {
      const d = new DID({
        method: 'example',
        id: '123',
        path: 'x/y',
        query: 'abc',
        params: [new Param('service', 'agent')]
      });
      expect('did:example:123;service=agent/x/y?abc').toBe(d.string());
    });

    it('includes Query after before Fragment', () => {
      const d = new DID({ method: 'example', id: '123', fragment: 'zyx', query: 'abc' });
      expect('did:example:123?abc#zyx').toBe(d.string());
    });

    it('includes Query', () => {
      const d = new DID({ method: 'example', id: '123', query: 'abc' });
      expect('did:example:123?abc').toBe(d.string());
    });

    it('includes Fragment', () => {
      const d = new DID({ method: 'example', id: '123', fragment: '00000' });
      expect('did:example:123#00000').toBe(d.string());
    });

    it('includes Fragment after Param', () => {
      const d = new DID({ method: 'example', id: '123', fragment: '00000' });
      expect('did:example:123#00000').toBe(d.string());
    });
  });

  describe('TestParse', () => {
    it('returns error if input is empty', () => {
      expect(() => DID.parse('')).toThrow();
    });

    it('returns error if input length is less than length 7', () => {
      expect(() => DID.parse('did:')).toThrow();
      expect(() => DID.parse('did:a')).toThrow();
      expect(() => DID.parse('did:a:')).toThrow();
    });

    it('returns error if input does not have a second const d to mark end of method', () => {
      expect(() => DID.parse('did:aaaaaaaaaaa')).toThrow();
    });

    it('returns error if method is empty', () => {
      expect(() => DID.parse('did::aaaaaaaaaaa')).toThrow();
    });

    it('returns error if id string is empty', () => {
      const dids = [
        'did:a::123:456',
        'did:a:123::456',
        'did:a:123:456:',
        'did:a:123:/abc',
        'did:a:123:#abc'
      ];
      for (const did of dids) {
        expect(() => DID.parse(did)).toThrow();
      }
    });

    it('returns error if input does not begin with did: scheme', () => {
      expect(() => DID.parse('a:12345')).toThrow();
    });

    it('returned value is nil if input does not begin with did: scheme', () => {
      expect(() => DID.parse('a:12345')).toThrow();
    });

    it('succeeds if it has did prefix and length is greater than 7', () => {
      expect(DID.parse('did:a:1')).toBeDefined();
    });

    it('succeeds to extract method', () => {
      expect('a').toBe(DID.parse('did:a:1').method);

      expect(DID.parse('did:abcdef:11111').method).toBe('abcdef');
    });

    it('returns error if method has any other char than 0-9 or a-z', () => {
      expect(() => DID.parse('did:aA:1')).toThrow();
      expect(() => DID.parse('did:aa-aa:1')).toThrow();
    });

    it('succeeds to extract id', () => {
      expect(DID.parse('did:a:1').id).toBe('1');
    });

    it('succeeds to extract id parts', () => {
      const d = DID.parse('did:a:123:456');
      expect('123').toBe(d.idStrings[0]);
      expect('456').toBe(d.idStrings[1]);
    });

    it('returns error if ID has an invalid char', () => {
      expect(() => DID.parse('did:a:1&&111')).toThrow();
    });

    it('returns error if param name is empty', () => {
      expect(() => DID.parse('did:a:123:456;')).toThrow();
    });

    it('returns error if Param name has an invalid char', () => {
      expect(() => DID.parse('did:a:123:456;serv&ce')).toThrow();
    });

    it('returns error if Param value has an invalid char', () => {
      expect(() => DID.parse('did:a:123:456;service=ag&nt')).toThrow();
    });

    it('returns error if Param name has an invalid percent encoded', () => {
      expect(() => DID.parse('did:a:123:456;ser%2ge')).toThrow();
    });

    it('returns error if Param does not exist for value', () => {
      expect(() => DID.parse('did:a:123:456;=value')).toThrow();
    });

    // nolint: dupl
    // test for params look similar to linter
    it('succeeds to extract generic param with name and value', () => {
      const d = DID.parse('did:a:123:456;service==agent');
      expect(1).toBe(d.params.length);
      expect('service=agent').toBe(d.params[0].toString());
      expect('service').toBe(d.params[0].name);
      expect('agent').toBe(d.params[0].value);
    });

    // nolint: dupl
    // test for params look similar to linter
    it('succeeds to extract generic param with name only', () => {
      const d = DID.parse('did:a:123:456;service');
      expect(1).toBe(d.params.length);
      expect('service').toBe(d.params[0].toString());
      expect('service').toBe(d.params[0].name);
      expect('').toBe(d.params[0].value);
    });

    // nolint: dupl
    // test for params look similar to linter
    it('succeeds to extract generic param with name only and empty param', () => {
      const d = DID.parse('did:a:123:456;service=');
      expect(1).toBe(d.params.length);
      expect('service').toBe(d.params[0].toString());
      expect('service').toBe(d.params[0].name);
      expect('').toBe(d.params[0].value);
    });

    // nolint: dupl
    // test for params look similar to linter
    it('succeeds to extract method param with name and value', () => {
      const d = DID.parse('did:a:123:456;foo:bar=baz');
      expect(1).toBe(d.params.length);
      expect('foo:bar=baz').toBe(d.params[0].toString());
      expect('foo:bar').toBe(d.params[0].name);
      expect('baz').toBe(d.params[0].value);
    });

    // nolint: dupl
    // test for params look similar to linter
    it('succeeds to extract method param with name only', () => {
      const d = DID.parse('did:a:123:456;foo:bar');
      expect(1).toBe(d.params.length);
      expect('foo:bar').toBe(d.params[0].toString());
      expect('foo:bar').toBe(d.params[0].name);
      expect('').toBe(d.params[0].value);
    });

    // nolint: dupl
    // test for params look similar to linter
    it('succeeds with percent encoded chars in param name and value', () => {
      const d = DID.parse('did:a:123:456;serv%20ice=val%20ue');
      expect(1).toBe(d.params.length);
      expect('serv%20ice=val%20ue').toBe(d.params[0].toString());
      expect('serv%20ice').toBe(d.params[0].name);
      expect('val%20ue').toBe(d.params[0].value);
    });

    // nolint: dupl
    // test for params look similar to linter
    it('succeeds to extract multiple generic params with name only', () => {
      const d = DID.parse('did:a:123:456;foo;bar');
      expect(2).toBe(d.params.length);
      expect('foo').toBe(d.params[0].name);
      expect('').toBe(d.params[0].value);
      expect('bar').toBe(d.params[1].name);
      expect('').toBe(d.params[1].value);
    });

    // nolint: dupl
    // test for params look similar to linter
    it('succeeds to extract multiple params with names and values', () => {
      const d = DID.parse('did:a:123:456;service=agent;foo:bar=baz');
      expect(2).toBe(d.params.length);
      expect('service').toBe(d.params[0].name);
      expect('agent').toBe(d.params[0].value);
      expect('foo:bar').toBe(d.params[1].name);
      expect('baz').toBe(d.params[1].value);
    });

    // nolint: dupl
    // test for params look similar to linter
    it('succeeds to extract path after generic param', () => {
      const d = DID.parse('did:a:123:456;service==value/a/b');
      expect(1).toBe(d.params.length);
      expect('service=value').toBe(d.params[0].toString());
      expect('service').toBe(d.params[0].name);
      expect('value').toBe(d.params[0].value);

      const segments = d.pathSegments;
      expect('a').toBe(segments[0]);
      expect('b').toBe(segments[1]);
    });

    // nolint: dupl
    // test for params look similar to linter
    it('succeeds to extract path after generic param name and no value', () => {
      const d = DID.parse('did:a:123:456;service=/a/b');
      expect(1).toBe(d.params.length);
      expect('service').toBe(d.params[0].toString());
      expect('service').toBe(d.params[0].name);
      expect('').toBe(d.params[0].value);

      const segments = d.pathSegments;
      expect('a').toBe(segments[0]);
      expect('b').toBe(segments[1]);
    });

    // nolint: dupl
    // test for params look similar to linter
    it('succeeds to extract query after generic param', () => {
      const d = DID.parse('did:a:123:456;service=value?abc');
      expect(1).toBe(d.params.length);
      expect('service=value').toBe(d.params[0].toString());
      expect('service').toBe(d.params[0].name);
      expect('value').toBe(d.params[0].value);
      expect('abc').toBe(d.query);
    });

    // nolint: dupl
    // test for params look similar to linter
    it('succeeds to extract fragment after generic param', () => {
      const d = DID.parse('did:a:123:456;service=value#xyz');
      expect(1).toBe(d.params.length);
      expect('service=value').toBe(d.params[0].toString());
      expect('service').toBe(d.params[0].name);
      expect('value').toBe(d.params[0].value);
      expect('xyz').toBe(d.fragment);
    });

    it('succeeds to extract path', () => {
      const d = DID.parse('did:a:123:456/someService');
      expect('someService').toBe(d.path);
    });

    it('succeeds to extract path segments', () => {
      const d = DID.parse('did:a:123:456/a/b');

      const segments = d.pathSegments;
      expect('a').toBe(segments[0]);
      expect('b').toBe(segments[1]);
    });

    it('succeeds with percent encoded chars in path', () => {
      const d = DID.parse('did:a:123:456/a/%20a');
      expect('a/%20a').toBe(d.path);
    });

    it('returns error if % in path is not followed by 2 hex chars', () => {
      const dids = [
        'did:a:123:456/%',
        'did:a:123:456/%a',
        'did:a:123:456/%!*',
        'did:a:123:456/%A!',
        'did:xyz:pqr#%A!',
        'did:a:123:456/%A%'
      ];
      for (const did of dids) {
        expect(() => DID.parse(did)).toThrow();
      }
    });

    it('returns error if path is empty but there is a slash', () => {
      expect(() => DID.parse('did:a:123:456/')).toThrow();
    });

    it('returns error if first path segment is empty', () => {
      expect(() => DID.parse('did:a:123:456//abc')).toThrow();
    });

    it('does not fail if second path segment is empty', () => {
      expect(() => DID.parse('did:a:123:456/abc//pqr')).not.toThrow();
    });

    it('returns error  if path has invalid char', () => {
      expect(() => DID.parse('did:a:123:456/ssss^sss')).toThrow();
    });

    it('does not fail if path has at least one segment and a trailing slash', () => {
      expect(() => DID.parse('did:a:123:456/a/b/')).not.toThrow();
    });

    it('succeeds to extract query after id string', () => {
      const d = DID.parse('did:a:123?abc');
      expect('a').toBe(d.method);
      expect('123').toBe(d.id);
      expect('abc').toBe(d.query);
    });

    it('succeeds to extract query after path', () => {
      const d = DID.parse('did:a:123/a/b/c?abc');
      expect('a').toBe(d.method);
      expect('123').toBe(d.id);
      expect('a/b/c').toBe(d.path);
      expect('abc').toBe(d.query);
    });

    it('succeeds to extract fragment after query', () => {
      const d = DID.parse('did:a:123?abc#xyz');
      expect('abc').toBe(d.query);
      expect('xyz').toBe(d.fragment);
    });

    it('succeeds with percent encoded chars in query', () => {
      const d = DID.parse('did:a:123?ab%20c');
      expect('ab%20c').toBe(d.query);
    });

    it('returns error if % in query is not followed by 2 hex chars', () => {
      const dids = [
        'did:a:123:456?%',
        'did:a:123:456?%a',
        'did:a:123:456?%!*',
        'did:a:123:456?%A!',
        'did:xyz:pqr?%A!',
        'did:a:123:456?%A%'
      ];
      for (const did of dids) {
        expect(() => DID.parse(did)).toThrow();
      }
    });

    it('returns error if query has invalid char', () => {
      expect(() => DID.parse('did:a:123:456?ssss^sss')).toThrow();
    });

    it('succeeds to extract fragment', () => {
      const d = DID.parse('did:a:123:456#keys-1');
      expect('keys-1').toBe(d.fragment);
    });

    it('succeeds with percent encoded chars in fragment', () => {
      const d = DID.parse('did:a:123:456#aaaaaa%20a');
      expect('aaaaaa%20a').toBe(d.fragment);
    });

    it('returns error if % in fragment is not followed by 2 hex chars', () => {
      const dids = [
        'did:xyz:pqr#%',
        'did:xyz:pqr#%a',
        'did:xyz:pqr#%!*',
        'did:xyz:pqr#%!A',
        'did:xyz:pqr#%A!',
        'did:xyz:pqr#%A%'
      ];
      for (const did of dids) {
        expect(() => DID.parse(did)).toThrow();
      }
    });

    it('fails if fragment has invalid char', () => {
      expect(() => DID.parse('did:a:123:456#ssss^sss')).toThrow();
    });
  });

  it('isNotValidParamChar', () => {
    let a = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z',
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '.',
      '-',
      '_',
      ':'
    ];
    for (const c of a) {
      expect(false).toBe(StringUtils.isNotValidParamChar(c));
    }

    a = [
      '%',
      '^',
      '#',
      ' ',
      '~',
      '!',
      '$',
      '&',
      "'",
      '(',
      ')',
      '*',
      '+',
      ',',
      ';',
      '=',
      '@',
      '/',
      '?'
    ];
    for (const c of a) {
      expect(true).toBe(StringUtils.isNotValidParamChar(c));
    }
  });

  it('isNotValidIDChar', () => {
    let a = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z',
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '.',
      '-'
    ];
    for (const c of a) {
      expect(false).toBe(StringUtils.isNotValidIDChar(c));
    }

    a = [
      '%',
      '^',
      '#',
      ' ',
      '_',
      '~',
      '!',
      '$',
      '&',
      "'",
      '(',
      ')',
      '*',
      '+',
      ',',
      ';',
      '=',
      ':',
      '@',
      '/',
      '?'
    ];
    for (const c of a) {
      expect(true).toBe(StringUtils.isNotValidIDChar(c));
    }
  });

  it('StringUtils.isNotValidQueryOrFragmentChar', () => {
    let a = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z',
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '-',
      '.',
      '_',
      '~',
      '!',
      '$',
      '&',
      "'",
      '(',
      ')',
      '*',
      '+',
      ',',
      ';',
      '=',
      ':',
      '@',
      '/',
      '?'
    ];
    for (const c of a) {
      expect(false).toBe(StringUtils.isNotValidQueryOrFragmentChar(c));
    }

    a = ['%', '^', '#', ' '];
    for (const c of a) {
      expect(true).toBe(StringUtils.isNotValidQueryOrFragmentChar(c));
    }
  });

  it('isNotValidPathChar', () => {
    let a = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z',
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '-',
      '.',
      '_',
      '~',
      '!',
      '$',
      '&',
      "'",
      '(',
      ')',
      '*',
      '+',
      ',',
      ';',
      '=',
      ':',
      '@'
    ];
    for (const c of a) {
      expect(false).toBe(StringUtils.isNotValidPathChar(c));
    }

    a = ['%', '/', '?'];
    for (const c of a) {
      expect(true).toBe(StringUtils.isNotValidPathChar(c));
    }
  });

  it('isNotUnreservedOrSubdelim', () => {
    let a = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z',
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '-',
      '.',
      '_',
      '~',
      '!',
      '$',
      '&',
      "'",
      '(',
      ')',
      '*',
      '+',
      ',',
      ';',
      '='
    ];
    for (const c of a) {
      expect(false).toBe(StringUtils.isNotUnreservedOrSubdelim(c));
    }

    a = ['%', ':', '@', '/', '?'];
    for (const c of a) {
      expect(true).toBe(StringUtils.isNotUnreservedOrSubdelim(c));
    }
  });

  it('isNotHexDigit', () => {
    let a = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f'
    ];
    for (const c of a) {
      expect(false).toBe(StringUtils.isNotHexDigit(c));
    }

    a = ['G', 'g', '%', '\x40', '\x47', '\x60', '\x67'];
    for (const c of a) {
      expect(true).toBe(StringUtils.isNotHexDigit(c));
    }
  });

  it('StringUtils.isNotDigit', () => {
    let a = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    for (const c of a) {
      expect(false).toBe(StringUtils.isNotDigit(c));
    }

    a = ['A', 'a', '\x29', '\x40', '/'];
    for (const c of a) {
      expect(true).toBe(StringUtils.isNotDigit(c));
    }
  });

  it('isNotAlpha', () => {
    let a = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z'
    ];
    for (const c of a) {
      expect(false).toBe(StringUtils.isNotAlpha(c));
    }

    a = ['\x40', '\x5B', '\x60', '\x7B', '0', '9', '-', '%'];
    for (const c of a) {
      expect(true).toBe(StringUtils.isNotAlpha(c));
    }
  });

  // nolint: dupl
  // Test_isNotSmallLetter and Test_isNotBigLetter look too similar to the dupl linter, ignore it
  it('isNotBigLetter', () => {
    let a = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z'
    ];
    for (const c of a) {
      expect(false).toBe(StringUtils.isNotBigLetter(c));
    }

    a = ['\x40', '\x5B', 'a', 'z', '1', '9', '-', '%'];
    for (const c of a) {
      expect(true).toBe(StringUtils.isNotBigLetter(c));
    }
  });

  // nolint: dupl
  // Test_isNotSmallLetter and Test_isNotBigLetter look too similar to the dupl linter, ignore it
  it('isNotSmallLetter', () => {
    let a = [
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z'
    ];
    for (const c of a) {
      expect(false).toBe(StringUtils.isNotSmallLetter(c));
    }

    a = ['\x60', '\x7B', 'A', 'Z', '1', '9', '-', '%'];
    for (const c of a) {
      expect(true).toBe(StringUtils.isNotSmallLetter(c));
    }
  });
});

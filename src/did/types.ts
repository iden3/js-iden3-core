export class Param {
  constructor(public name: string, public value: string) {}

  toString(): string {
    if (!this.name) {
      return '';
    }
    if (!this.value) {
      return this.name;
    }
    return `${this.name}=${this.value}`;
  }
}

export interface IDID {
  method: string;
  id: string;
  idStrings: string[];
  params: Param[];
  path: string;
  pathSegments: string[];
  query: string;
  fragment: string;
}

export const initDIDParams: IDID = Object.freeze({
  method: '',
  id: '',
  idStrings: [],
  params: [],
  path: '',
  pathSegments: [],
  query: '',
  fragment: ''
});

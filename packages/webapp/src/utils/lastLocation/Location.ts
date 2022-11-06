export interface Location {
  pathname: string;
  search: string;
  hash: string;
  state: any;
}

export const DefaultLocation: Location = {
  pathname: '/',
  search: '',
  hash: '',
  state: {}
}

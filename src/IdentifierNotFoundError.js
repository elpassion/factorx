// @flow

export default class IdentifierNotFoundError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'IdentifierNotFoundError';
  }
}

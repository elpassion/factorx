// @flow

export default class ExpressionNotFoundError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ExpressionNotFoundError';
  }
}

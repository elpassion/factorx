// @flow
import ExpressionNotFoundError from '../src/ExpressionNotFoundError';
import AstExplorer from '../src/AstExplorer';
import Position from '../src/Position';

describe('extractVariable', () => {
  const expectExtractVariable = (code, start, end) => {
    const astExplorer = new AstExplorer(code);
    expect(astExplorer.extractVariable(new Position(start, end))).toMatchSnapshot();
  };
  describe('with correct selection', () => {
    test('returns correct code', () => {
      expectExtractVariable('5 + 2', 0, 1);
      expectExtractVariable('5 + 2', 4, 5);
      expectExtractVariable('5 + 2', 0, 5);
      expectExtractVariable('() => {\n  5 + 2\n}', 10, 11);
    });
  });

  describe('when incorrect selection', () => {
    test('throws an error', () => {
      expect(() => {
        new AstExplorer('5 + 2').extractVariable(new Position(42, 42));
      }).toThrowError(new ExpressionNotFoundError());
    });
  });
});

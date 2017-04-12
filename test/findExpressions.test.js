// @flow
import AstExplorer from '../src/AstExplorer';
import ExpressionNotFoundError from '../src/ExpressionNotFoundError';
import Position from '../src/Position';

describe('findExpressions', () => {
  const binaryExpression = '5 + 2';

  const expectFindExpressions = (code, start, end) => {
    const astExplorer = new AstExplorer(code);
    expect(astExplorer.findExpressions(new Position(start, end))).toMatchSnapshot();
  };

  describe('at start of an expression', () => {
    it('returns all expressions containing the position', () => {
      expectFindExpressions(binaryExpression, 0, 0);
      expectFindExpressions(binaryExpression, 2, 2);
      expectFindExpressions(binaryExpression, 4, 4);
    });
  });

  describe('at end of an expression', () => {
    it('returns all expressions containing the position', () => {
      expectFindExpressions(binaryExpression, 1, 1);
      expectFindExpressions(binaryExpression, 3, 3);
      expectFindExpressions(binaryExpression, 5, 5);
    });
  });

  describe('when selecting the expression fully', () => {
    it('returns only the selected expression', () => {
      expectFindExpressions(binaryExpression, 0, 1);
      expectFindExpressions(binaryExpression, 0, 5);
      expectFindExpressions(binaryExpression, 4, 5);
    });
  });

  describe('when not inside an expression', () => {
    it('throws an error', () => {
      expect(() => {
        new AstExplorer('5 + 2').findExpressions(new Position(42, 42));
      }).toThrowError(new ExpressionNotFoundError());
      expect(() => {
        new AstExplorer('5 + 2').findExpressions(new Position(0, 3));
      }).toThrowError(new ExpressionNotFoundError());
    });
  });
});

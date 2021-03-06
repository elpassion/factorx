// @flow
import AstExplorer from '../src/AstExplorer';
import ExpressionNotFoundError from '../src/ExpressionNotFoundError';
import Position from '../src/Position';

describe('findExpressions', () => {
  const binaryExpression = '5 + 2';
  const functionCode = '() => { 5 + 2 }';
  const ifStatement = '() => { if(5 > 3) { const u = 69 } }';
  const nestedFunctionCode = 'function a() {\n  function b() { 2 + 2 }\n const a = 5; }';

  const expectFindExpressions = (code, start, end) => {
    const astExplorer = new AstExplorer(code);
    expect(astExplorer.findExpressions(new Position(start, end))).toMatchSnapshot();
  };

  describe('at start of an expression', () => {
    it('returns all expressions containing the position at start of the expression', () => {
      expectFindExpressions(binaryExpression, 0, 0);
      expectFindExpressions(binaryExpression, 2, 2);
      expectFindExpressions(binaryExpression, 4, 4);
      expectFindExpressions(functionCode, 8, 8);
      expectFindExpressions(functionCode, 10, 10);
      expectFindExpressions(functionCode, 12, 12);
      expectFindExpressions(nestedFunctionCode, 32, 32);
      expectFindExpressions(ifStatement, 11, 11);
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
      expectFindExpressions(functionCode, 0, 15);
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

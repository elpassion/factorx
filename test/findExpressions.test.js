// @flow
import { findExpressions, ExpressionNotFoundError } from '../src/findExpressions';

const binaryExpression = '5 + 2';

describe('findExpressions', () => {
  function testFindExpressions(code, selection) {
    expect(findExpressions(code, selection)).toMatchSnapshot();
  }

  function testFindEexpressionsThrows(code, selection) {
    const findUnexistingExpressions = () => {
      findExpressions(code, selection);
    };
    expect(findUnexistingExpressions).toThrowError(new ExpressionNotFoundError());
  }

  describe('when not exact', () => {
    describe('at start of an expression', () => {
      it('returns all expressions containing the position', () => {
        testFindExpressions(binaryExpression, {
          start: { line: 0, column: 2 },
          end: { line: 0, column: 2 },
        });
        testFindExpressions(binaryExpression, {
          start: { line: 0, column: 0 },
          end: { line: 0, column: 0 },
        });
        testFindExpressions(binaryExpression, {
          start: { line: 0, column: 4 },
          end: { line: 0, column: 4 },
        });
      });
    });

    describe('at end of an expression', () => {
      it('returns all expressions containing the position', () => {
        testFindExpressions(binaryExpression, {
          start: { line: 0, column: 1 },
          end: { line: 0, column: 1 },
        });
        testFindExpressions(binaryExpression, {
          start: { line: 0, column: 3 },
          end: { line: 0, column: 3 },
        });
        testFindExpressions(binaryExpression, {
          start: { line: 0, column: 5 },
          end: { line: 0, column: 5 },
        });
      });
    });

    describe('when not inside an expression', () => {
      it('throws an error', () => {
        testFindEexpressionsThrows(binaryExpression, {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 1 },
        });
        testFindEexpressionsThrows(binaryExpression, {
          start: { line: 0, column: 10 },
          end: { line: 1, column: 1 },
        });
      });
    });
  });
  describe('when exact', () => {
    describe('at start of an expression', () => {
      it('returns all expressions containing the position', () => {
        testFindExpressions(binaryExpression, {
          start: { line: 0, column: 2 },
          end: { line: 0, column: 2 },
        });
        testFindExpressions(binaryExpression, {
          start: { line: 0, column: 0 },
          end: { line: 0, column: 0 },
        });
        testFindExpressions(binaryExpression, {
          start: { line: 0, column: 4 },
          end: { line: 0, column: 4 },
        });
      });
    });
  });
});

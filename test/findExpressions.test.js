// @flow
import findExpressions from '../src/findExpressions';
import Position from '../src/Position';

describe('findExpressions', () => {
  describe('when not exact', () => {
    const binaryExpression = '5 + 2';

    const expectFindExpressions = (code, start, end) => {
      expect(findExpressions(code, new Position(start, end))).toMatchSnapshot();
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

    describe('when not inside an expression', () => {
      it('throws an error', () => {
        // testFindExpressions(binaryExpression, [10, 10]);
      });
    });
  });
});

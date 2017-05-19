// @flow
import testAllAssumptions from './helpers/testAllAssumptions';
import ExpressionNotFoundError from '../src/ExpressionNotFoundError';
import AstExplorer from '../src/AstExplorer';
import Position from '../src/Position';

describe('extractVariable', () => {
  describe('with correct selections', () => {
    testAllAssumptions('extractVariable', ({ code, selections }) => {
      const astExplorer = new AstExplorer(code);
      const positions = selections.map(({ start, end }) => new Position(start, end));
      const result = astExplorer.extractVariable(positions, { type: 'const' });
      return {
        code: result.code,
        selections: result.cursorPositions.map(({ start, end }) => ({ start, end })),
      };
    });
  });

  describe('with incorrect selections', () => {
    test('throws an error', () => {
      expect(() => {
        new AstExplorer('5 + 2').extractVariable(new Position(42, 42));
      }).toThrowError(new ExpressionNotFoundError());
    });
    test('throws an error 2', () => {
      const positions = [{ start: 0, end: 1 }, { start: 42, end: 42 }].map(
        selection => new Position(selection.start, selection.end),
      );
      const astExplorer = new AstExplorer('5 + 5');
      expect(() => {
        astExplorer.extractVariable(positions);
      }).toThrowError(new ExpressionNotFoundError());
    });
  });
});

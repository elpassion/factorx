// @flow
import ExpressionNotFoundError from '../src/ExpressionNotFoundError';
import AstExplorer from '../src/AstExplorer';
import Position from '../src/Position';

describe('extractVariable', () => {
  const expectExtractVariable = (code, start, end) => {
    const astExplorer = new AstExplorer(code);
    expect(astExplorer.extractVariable(new Position(start, end))).toMatchSnapshot();
  };

  const expectExtractConst = (code, start, end) => {
    const astExplorer = new AstExplorer(code);
    expect(
      astExplorer.extractVariable(new Position(start, end), { type: 'const' }),
    ).toMatchSnapshot();
  };

  describe('with correct selection', () => {
    test('returns correct code', () => {
      expectExtractVariable('5 + 2', 0, 1);
      expectExtractVariable('5 + 2', 4, 5);
      expectExtractVariable('5 + 2', 0, 5);
      expectExtractVariable('() => {\n  5 + 2\n}', 10, 11);
      expectExtractVariable('let a = do { 5 + 2 }', 13, 14);
      expectExtractVariable('import a from "b";5;', 18, 19);
    });
  });

  describe('with const as a type param', () => {
    test('returns correct code', () => {
      expectExtractConst('5 + 2', 0, 1);
      expectExtractConst('5 + 2', 4, 5);
      expectExtractConst('5 + 2', 0, 5);
      expectExtractConst('() => {\n  5 + 2\n}', 10, 11);
      expectExtractConst('let a = do { 5 + 2 }', 13, 14);
      expectExtractConst('import a from "b";5;', 18, 19);
    });
  });

  describe('when incorrect selection', () => {
    test('throws an error', () => {
      expect(() => {
        new AstExplorer('5 + 2').extractVariable(new Position(42, 42));
      }).toThrowError(new ExpressionNotFoundError());
    });
  });

  describe('with multiple selections', () => {
    describe('with correct selection', () => {
      const expectExtractMultipleVariables = (code, selections, type = 'let') => {
        const positions = selections.map(selection => new Position(selection.start, selection.end));
        const astExplorer = new AstExplorer(code);
        expect(astExplorer.extractMultipleVariables(positions, { type })).toMatchSnapshot();
      };
      test('returns correct code', () => {
        expectExtractMultipleVariables('5 + 5', [{ start: 0, end: 1 }, { start: 4, end: 5 }]);
        expectExtractMultipleVariables(
          '5 + 5',
          [{ start: 0, end: 1 }, { start: 4, end: 5 }],
          'const',
        );
      });
    });

    describe('when incorrect selection', () => {
      test('throws an error', () => {
        const positions = [{ start: 0, end: 1 }, { start: 42, end: 42 }].map(
          selection => new Position(selection.start, selection.end),
        );
        const astExplorer = new AstExplorer('5 + 5');
        expect(() => {
          astExplorer.extractMultipleVariables(positions);
        }).toThrowError(new ExpressionNotFoundError());
      });
    });
  });
});

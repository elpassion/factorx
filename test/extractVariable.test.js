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
      expectExtractVariable('import a from "b";\n5;', 19, 20);
    });

    test('extracts only as high as it has to', () => {
      const astExplorer = new AstExplorer('const a = 6;\na + 9;');
      const expected = {
        code: 'const a = 6;\nlet _ref = 9;\na + _ref;',
        cursorPosition: new Position(17, 21),
      };
      expect(astExplorer.extractVariable(new Position(17, 18))).toEqual(expected);
    });
  });

  describe('with const as a type param', () => {
    test('returns correct code', () => {
      expectExtractConst('5 + 2', 0, 1);
      expectExtractConst('5 + 2', 4, 5);
      expectExtractConst('5 + 2', 0, 5);
      expectExtractConst('() => {\n  5 + 2\n}', 10, 11);
      expectExtractConst('let a = do { 5 + 2 }', 13, 14);
      expectExtractConst('import a from "b";\n5;', 19, 20);
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
      test('extracts only as high as it has to 2', () => {
        const astExplorer = new AstExplorer('const a = 6;\n() => { 5 + 5 };\n5');
        const expected = {
          code: 'const a = 6;\nlet _ref = 5;\n() => { _ref + _ref };\n_ref',
          cursorPosition: new Position(17, 21),
        };
        expect(
          astExplorer.extractMultipleVariables([
            new Position(30, 31),
            new Position(21, 22),
            new Position(25, 26),
          ]),
        ).toEqual(expected);
      });
      test('extracts only as high as it has to 3', () => {
        const astExplorer = new AstExplorer('const a = () => { 5 + 5 };\n5');
        const expected = {
          code: 'const a = () => {\n  let _ref = 5;\n  _ref + _ref\n};\n5',
          cursorPosition: new Position(24, 28),
        };
        expect(
          astExplorer.extractMultipleVariables([new Position(18, 19), new Position(22, 23)]),
        ).toEqual(expected);
      });
      test('extracts only as high as it has to in nested scopes', () => {
        const astExplorer = new AstExplorer('() => { 5 + 5 };\n5');
        const expected = {
          code: 'let _ref = 5;\n() => { _ref + _ref };\n_ref',
          cursorPosition: new Position(4, 8),
        };
        expect(
          astExplorer.extractMultipleVariables([
            new Position(17, 18),
            new Position(8, 9),
            new Position(12, 13),
          ]),
        ).toEqual(expected);
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

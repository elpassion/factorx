// @flow
import AstExplorer from '../src/AstExplorer';
import Position from '../src/Position';
import IdentifierNotFoundError from '../src/IdentifierNotFoundError';

describe('renameIdentifier', () => {
  test('works when position is on the declaration', () => {
    const astExplorer = new AstExplorer('const _ref = 2;\n5 + _ref');
    expect(astExplorer.renameIdentifier(new Position(6, 6), 'm')).toEqual({
      code: 'const m = 2;\n5 + m',
      cursorPosition: new Position(7, 7),
    });
  });

  test('works when position is on the usage', () => {
    const astExplorer = new AstExplorer('const _ref = 2;\n5 + _ref');
    expect(astExplorer.renameIdentifier(new Position(20, 20), 'm')).toEqual({
      code: 'const m = 2;\n5 + m',
      cursorPosition: new Position(21, 21),
    });
  });

  test('returns error when not on identifier', () => {
    const astExplorer = new AstExplorer('const _ref = 2;\n5 + _ref');
    expect(() => astExplorer.renameIdentifier(new Position(42, 42), 'm')).toThrow(
      new IdentifierNotFoundError(),
    );
  });
});

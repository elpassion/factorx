// @flow
import AstExplorer from '../src/AstExplorer';
import Position from '../src/Position';

describe('findExpressionOccurrences', () => {
  it('works with single occurrence', () => {
    const code = '5 + 2';
    const astExplorer = new AstExplorer(code);
    expect(astExplorer.findExpressionOccurrences(new Position(0, 1))).toMatchSnapshot();
  });

  it('works with multiple occurrences', () => {
    const code = '5 + 5';
    const astExplorer = new AstExplorer(code);
    expect(astExplorer.findExpressionOccurrences(new Position(0, 1))).toMatchSnapshot();
  });

  it('works with multiple occurrences of strings', () => {
    const code = '"abc" + "abc"';
    const astExplorer = new AstExplorer(code);
    expect(astExplorer.findExpressionOccurrences(new Position(0, 5))).toMatchSnapshot();
  });

  it('works with multiple occurrences of new', () => {
    const code = 'const a = new A();\nconst b = new A();';
    const astExplorer = new AstExplorer(code);
    expect(astExplorer.findExpressionOccurrences(new Position(10, 10))).toMatchSnapshot();
  });

  it('works with values in objects', () => {
    const code = '() => ({ a: 5, b: 5 })';
    const astExplorer = new AstExplorer(code);
    expect(astExplorer.findExpressionOccurrences(new Position(12, 13))).toMatchSnapshot();
  });

  it('works with values in arrays', () => {
    const code = '[5, 5]';
    const astExplorer = new AstExplorer(code);
    expect(astExplorer.findExpressionOccurrences(new Position(1, 2))).toMatchSnapshot();
  });

  it('works in correct order', () => {
    const code = '[5, 5]';
    const astExplorer = new AstExplorer(code);
    expect(astExplorer.findExpressionOccurrences(new Position(4, 5))).toMatchSnapshot();
  });

  it('works with multiple objects', () => {
    const code = '() => { const a = { a: 5, b: 5 }; const b = { a: 5, b: 5 }; }';
    const astExplorer = new AstExplorer(code);
    expect(astExplorer.findExpressionOccurrences(new Position(18, 32))).toMatchSnapshot();
  });

  it('works with multiple arrays', () => {
    const code = '[5, 5]; [5, 5]';
    const astExplorer = new AstExplorer(code);
    expect(astExplorer.findExpressionOccurrences(new Position(0, 6))).toMatchSnapshot();
  });

  it('works with multiple scopes', () => {
    const code = '() => { 3 + 3 };\n() => { 3 + 6 };';
    const astExplorer = new AstExplorer(code);
    expect(astExplorer.findExpressionOccurrences(new Position(8, 9))).toMatchSnapshot();
  });

  it('works with this', () => {
    const code = 'const a = { b: 0, c: this.b };';
    const astExplorer = new AstExplorer(code);
    expect(astExplorer.findExpressionOccurrences(new Position(10, 29))).toMatchSnapshot();
  });
});

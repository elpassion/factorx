// @flow
import AstExplorer from '../src/AstExplorer';
import Position from '../src/Position';

describe('findExpressionOccurrences', () => {
  it('works with single occurrence', () => {
    const binaryExpression = '5 + 2';
    const astExplorer = new AstExplorer(binaryExpression);
    expect(astExplorer.findExpressionOccurrences(new Position(0, 1))).toMatchSnapshot();
  });

  it('works with multiple occurrences', () => {
    const binaryExpression = '5 + 5';
    const astExplorer = new AstExplorer(binaryExpression);
    expect(astExplorer.findExpressionOccurrences(new Position(0, 1))).toMatchSnapshot();
  });

  it('works with multiple occurrences of strings', () => {
    const binaryExpression = '"abc" + "abc"';
    const astExplorer = new AstExplorer(binaryExpression);
    expect(astExplorer.findExpressionOccurrences(new Position(0, 5))).toMatchSnapshot();
  });

  it('works with values in objects', () => {
    const binaryExpression = '() => ({ a: 5, b: 5 })';
    const astExplorer = new AstExplorer(binaryExpression);
    expect(astExplorer.findExpressionOccurrences(new Position(12, 13))).toMatchSnapshot();
  });

  it('works with values in arrays', () => {
    const binaryExpression = '[5, 5]';
    const astExplorer = new AstExplorer(binaryExpression);
    expect(astExplorer.findExpressionOccurrences(new Position(1, 2))).toMatchSnapshot();
  });

  it('works with objects', () => {
    const binaryExpression = '() => { const a = { a: 5, b: 5 }; const b = { a: 5, b: 5 }; }';
    const astExplorer = new AstExplorer(binaryExpression);
    expect(astExplorer.findExpressionOccurrences(new Position(18, 32))).toMatchSnapshot();
  });

  it('works with arrays', () => {
    const binaryExpression = '[5, 5]';
    const astExplorer = new AstExplorer(binaryExpression);
    expect(astExplorer.findExpressionOccurrences(new Position(1, 2))).toMatchSnapshot();
  });

  it('works with multiple scopes', () => {
    const multipleScopesCode = '() => { 3 + 3 };\n() => { 3 + 6 };';
    const astExplorer = new AstExplorer(multipleScopesCode);
    expect(astExplorer.findExpressionOccurrences(new Position(8, 9))).toMatchSnapshot();

    expect(astExplorer.findExpressionOccurrences(new Position(25, 26))).toMatchSnapshot();
  });
});

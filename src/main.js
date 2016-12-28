// @flow
const cst = require('cst')
const {
  VariableDeclarator,
  VariableDeclaration,
  Identifier,
  NumericLiteral
} = cst.types
const {Token} = cst

export function tokenAt (code: string, line: number, column: number) {
  function isInTokenColumnRange (token) {
    const {start, end} = token.getLoc()
    return start.column <= column && end.column >= column
  }

  function isInTokenLineRange (token) {
    return token.getLoc().start.line === line
  }

  const ast = parse(code)
  let token = ast.getFirstToken()

  while (!isInTokenLineRange(token) || !isInTokenColumnRange(token)) {
    token = token.getNextToken()
  }
  return token
}

export function extract (code: string, line: number, column: number) {
  const token = tokenAt(code, line, column)

  let VD = new VariableDeclaration([
    new Token('Keyword', 'const'),
    new Token('Whitespace', ' '),

    new VariableDeclarator([
      new Identifier([
        new Token('Identifier', 'a')
      ]),

      new Token('Whitespace', ' '),
      new Token('Punctuator', '='),
      new Token('Whitespace', ' '),

      // Yeah, a bit convoluted but that's is what we have in original babylon AST
      new NumericLiteral([
        new Token('Numeric', token.value)
      ])
    ]),
    new Token('Whitespace', '\n')
  ])
  const ast = parse(code)
  ast.prependChild(VD)
  return ast
}

function parse (code) {
  return new cst.Parser().parse(code)
}

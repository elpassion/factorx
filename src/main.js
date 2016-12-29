// @flow
const cst = require('cst')
const {
  VariableDeclarator,
  VariableDeclaration,
  Identifier
} = cst.types
const {Token} = cst

export function tokenAt (ast: Object, line: number, column: number) {
  function isInTokenColumnRange (token) {
    const {start, end} = token.getLoc()
    return start.column <= column && end.column >= column
  }

  function isInTokenLineRange (token) {
    return token.getLoc().start.line === line
  }

  let token = ast.getFirstToken()

  while (!isInTokenLineRange(token) || !isInTokenColumnRange(token)) {
    token = token.getNextToken()
  }
  return token
}

export function extractVariable (
  code: string,
  line: number,
  column: number,
  variableKind: 'let' | 'const' | 'var',
  variableName: string
) {
  const ast = parse(code)
  const token = tokenAt(ast, line, column)
  const expression = token.parentElement
  let VD = new VariableDeclaration([
    new Token('Keyword', variableKind),
    new Token('Whitespace', ' '),

    new VariableDeclarator([
      new Identifier([
        new Token('Identifier', variableName)
      ]),

      new Token('Whitespace', ' '),
      new Token('Punctuator', '='),
      new Token('Whitespace', ' '),
      expression.cloneElement()
    ]),
    new Token('Whitespace', '\n')
  ])
  expression.parentElement.replaceChild(new Identifier([ new Token('Identifier', variableName) ]), expression)
  ast.prependChild(VD)
  return ast
}

export function parse (code: string): Object {
  return new cst.Parser().parse(code)
}

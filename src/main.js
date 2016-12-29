// @flow
const cst = require('cst')
const {
  VariableDeclarator,
  VariableDeclaration,
  Identifier
} = cst.types
const {Token} = cst

type location = {
  start: {
    line: number,
    column: number
  },
  end: {
    line: number,
    column: number
  }
}

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
  location: location,
  variableKind: 'let' | 'const' | 'var',
  variableName: string
) {
  const ast = parse(code)
  const expression = expressionAt(ast, location)

  function createIdentifier () {
    return new Identifier([new Token('Identifier', variableName)])
  }

  let VD = new VariableDeclaration([
    new Token('Keyword', variableKind),
    new Token('Whitespace', ' '),

    new VariableDeclarator([
      createIdentifier(),
      new Token('Whitespace', ' '),
      new Token('Punctuator', '='),
      new Token('Whitespace', ' '),
      expression.cloneElement()
    ]),
    new Token('Whitespace', '\n')
  ])

  expression.parentElement.replaceChild(createIdentifier(), expression)
  ast.prependChild(VD)
  return ast
}

export function expressionAt (ast: Object, {start, end}: location) {
  const token = tokenAt(ast, start.line, start.column)

  if (JSON.stringify(start) === JSON.stringify(end)) {
    if (token.parentElement.isExpression) {
      return token.parentElement
    } else {
      throw new Error('Selection does not form an expression')
    }
  } else {
    let element = token.parentElement

    while (!(
      element.getLoc().end.line === end.line &&
      element.getLoc().end.column === end.column &&
      element.isExpression)) {
      if (element.parentElement) {
        element = element.parentElement
      } else {
        throw new Error('Selection does not form an expression')
      }
    }
    return element
  }
}

export function parse (code: string): Object {
  return new cst.Parser().parse(code)
}

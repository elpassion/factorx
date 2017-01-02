// @flow
const flatten = require('lodash/flatten')
const cst = require('cst')
const {VariableDeclarator, VariableDeclaration, Identifier} = cst.types
const {Token, Parser} = cst

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

function notAnExpressionError () {
  return new Error('Selection does not form an expression')
}

export function expressionAt (ast: Object, {start: cursorStart, end: cursorEnd}: location) {
  const matchingExpression = expressionsAt(ast, {start: cursorStart, end: cursorEnd}).filter((expression) => {
    const {start: expressionStart, end: expressionEnd} = expression.getLoc()
    const isExpressionMatching = (
      expressionStart.column === cursorStart.column &&
      expressionStart.line === cursorStart.line + 1 &&
      expressionEnd.column === cursorEnd.column &&
      expressionEnd.line === cursorEnd.line + 1
    )
    return isExpressionMatching
  })[0]

  if (matchingExpression) {
    return matchingExpression
  } else {
    throw notAnExpressionError()
  }
}

export function expressionsAt (ast: Object, {start, end}: location) {
  function matchingExpressions (node, {start, end}, nodesInRange = []) {
    node.childElements.forEach((child) => {
      const {start: childStart, end: childEnd} = child.getLoc()
      const isChildInRange = (
        childStart.column <= start.column &&
        childStart.line <= start.line &&
        childEnd.column >= end.column &&
        childEnd.line >= end.line
      )
      if (isChildInRange) {
        if (child.isExpression) nodesInRange.push(child)
        matchingExpressions(child, {start, end}, nodesInRange)
      }
    })
    return flatten(nodesInRange)
  }

  const normalizedLocation = {
    start: {line: start.line + 1, column: start.column},
    end: {line: end.line + 1, column: end.column}
  }

  return matchingExpressions(ast, normalizedLocation)
}

export function parse (code: string): Object {
  return new Parser().parse(code)
}

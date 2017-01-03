// @flow
const flatten = require('lodash/flatten')
const cst = require('cst')
const {VariableDeclarator, VariableDeclaration, Identifier} = cst.types
const {Token, Parser} = cst

type cursorPosition = { line: number, column: number }
type location = { cursorStart: cursorPosition, cursorEnd: cursorPosition }

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

  let node = expression.parentElement
  let child = expression
  while (node.type !== 'Program' && node.type !== 'BlockStatement') {
    child = node
    node = node.parentElement
  }
  node.insertChildBefore(VD, child)
  expression.parentElement.replaceChild(createIdentifier(), expression)
  return ast
}

function notAnExpressionError () {
  return new Error('Selection does not form an expression')
}

export function expressionAt (ast: Object, {cursorStart, cursorEnd}: location) {
  const matchingExpression = expressionsAt(ast, {cursorStart, cursorEnd}).filter((expression) => {
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

export function expressionsAt (ast: Object, {cursorStart, cursorEnd}: location) {
  const normalizedLocation = {
    cursorStart: {line: cursorStart.line + 1, column: cursorStart.column},
    cursorEnd: {line: cursorEnd.line + 1, column: cursorEnd.column}
  }

  function matchingExpressions (node, nodesInRange = []) {
    node.childElements.forEach((child) => {
      const {start: childStart, end: childEnd} = child.getLoc()
      let isChildInRange
      if (childStart.line === childEnd.line) {
        isChildInRange = (
          childStart.column <= normalizedLocation.cursorStart.column &&
          childStart.line === normalizedLocation.cursorStart.line &&
          childEnd.column >= normalizedLocation.cursorEnd.column &&
          childEnd.line === normalizedLocation.cursorEnd.line
        )
      } else {
        isChildInRange = (
          childStart.line <= normalizedLocation.cursorStart.line &&
          childEnd.line >= normalizedLocation.cursorEnd.line
        )
      }
      if (isChildInRange) {
        if (child.isExpression) {
          nodesInRange.push(child)
        }
        matchingExpressions(child, nodesInRange)
      }
    })
    return flatten(nodesInRange)
  }

  return matchingExpressions(ast)
}

export function parse (code: string): Object {
  return new Parser().parse(code)
}

// @flow
import type {selection} from './types'
import {Token, Parser, types} from 'cst'
const {VariableDeclarator, VariableDeclaration, Identifier} = types
import {normalizeSelection} from './helpers'
import {findSelectedExpression, ExpressionNotFoundError} from './findExpressions'

function parse (code: string): Object {
  return new Parser().parse(code)
}

function createIdentifier () {
  return new Identifier([new Token('Identifier', '_ref')])
}

function createVariableDeclaration (identifier, expression) {
  return new VariableDeclaration([
    new Token('Keyword', 'const'),
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
}

function findExpressionScope (expression) {
  let parent = expression.parentElement
  let child = expression
  while (parent.type !== 'Program' && parent.type !== 'BlockStatement') {
    child = parent
    parent = parent.parentElement
  }
  return {parent, child}
}

export function extractVariable (code: string, selection: selection): string {
  const normalizedSelection = normalizeSelection(selection)
  const ast = parse(code)
  const expression = findSelectedExpression(ast, normalizedSelection)
  if (!expression) throw new ExpressionNotFoundError()
  const identifier = createIdentifier()
  const VD = createVariableDeclaration(identifier, expression)
  const {parent, child} = findExpressionScope(expression)

  parent.insertChildBefore(VD, child)
  expression.parentElement.replaceChild(identifier, expression)

  return ast.getSourceCode()
}

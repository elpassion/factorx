// @flow
import * as babylon from 'babylon'
import traverse from 'babel-traverse'
import * as t from 'babel-types'
import {filter} from 'lodash'

export function parse (code: string): Object {
  return babylon.parse(code, {plugins: ['jsx', 'flow']})
}

function getExpressions (ast: Object) {
  let expressions = []

  traverse(ast, {
    enter (path) { if (t.isExpression(path.node)) expressions.push(path.node) }
  })
  return expressions
}

type position = { line: number, column: number }
type selection = { start: position, end: position }

function normalizePosition (position: position) {
  return { line: position.line + 1, column: position.column }
}

function normalizeSelection (selection: selection) {
  return {
    start: normalizePosition(selection.start),
    end: normalizePosition(selection.end)
  }
}

export function expressionsAt (ast: Object, selection: selection) {
  const normalizedSelection = normalizeSelection(selection)
  const allExpressions = getExpressions(ast)

  function isOneLineExpression (expression) {
    const expressionPosition = expression.loc
    return expressionPosition.start.line === expressionPosition.end.line
  }

  function isOneLineExpressionInRange (expression) {
    const expressionPosition = expression.loc
    return (
      expressionPosition.start.column <= normalizedSelection.start.column &&
      expressionPosition.start.line === normalizedSelection.start.line &&
      expressionPosition.end.column >= normalizedSelection.end.column &&
      expressionPosition.end.line === normalizedSelection.end.line
    )
  }

  function isMultiLineExpressionInRange (expression) {
    const expressionPosition = expression.loc
    return (
      expressionPosition.start.line <= normalizedSelection.start.line &&
      expressionPosition.end.line >= normalizedSelection.end.line
    )
  }

  return filter(allExpressions, (expression) => {
    if (isOneLineExpression(expression)) {
      return isOneLineExpressionInRange(expression)
    } else {
      return isMultiLineExpressionInRange(expression)
    }
  })
}

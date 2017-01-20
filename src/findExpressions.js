// @flow
import {Parser} from 'cst'
import type {selection, expression} from './types'
import {flatten} from 'lodash'
import {normalizeSelection, denormalizeSelection} from './helpers'

export function parse (code: string): Object {
  return new Parser().parse(code)
}

function findAllExpressions (ast: Object) {
  const nodesIndex = ast._traverse._nodeIndex._index
  return flatten(Object.keys(nodesIndex).map(nodeType =>
    nodesIndex[nodeType].filter(node => node.isExpression)
  ))
}

function findExpressionsAt (ast: Object, selection: selection) {
  const allExpressions = findAllExpressions(ast)

  function isOneLineExpression (expression) {
    const expressionPosition = expression.getLoc()
    return expressionPosition.start.line === expressionPosition.end.line
  }

  function isOneLineExpressionInRange (expression) {
    const expressionPosition = expression.getLoc()
    return (
      expressionPosition.start.column <= selection.start.column &&
      expressionPosition.start.line === selection.start.line &&
      expressionPosition.end.column >= selection.end.column &&
      expressionPosition.end.line === selection.end.line
    )
  }

  function isMultiLineExpressionInRange (expression) {
    const expressionPosition = expression.getLoc()
    return (
      expressionPosition.start.line <= selection.start.line &&
      expressionPosition.end.line >= selection.end.line
    )
  }

  return allExpressions.filter((expression) => {
    if (isOneLineExpression(expression)) {
      return isOneLineExpressionInRange(expression)
    } else {
      return isMultiLineExpressionInRange(expression)
    }
  })
}

export function findExpressions (code: string, selection: selection): Array<expression> {
  const ast = parse(code)
  const normalizedSelection = normalizeSelection(selection)
  return findExpressionsAt(ast, normalizedSelection).map(expression => ({
    value: expression.getSourceCode(),
    selection: denormalizeSelection(expression.getLoc())
  }))
}

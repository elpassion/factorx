// @flow
import {Parser} from 'cst'
import type {selection, expression} from './types'
import {flatten} from 'lodash'
import {normalizeSelection, denormalizeSelection} from './helpers'

function parse (code: string): Object {
  return new Parser().parse(code)
}

function findAllExpressions (ast: Object) {
  const nodesIndex = ast._traverse._nodeIndex._index
  return flatten(Object.keys(nodesIndex).map(nodeType =>
    nodesIndex[nodeType].filter(node => node.isExpression)
  ))
}

export function findSelectedExpression (ast: Object, selection: selection) {
  const allExpressions = findAllExpressions(ast)

  function isSearchedExpression (expression) {
    const expressionPosition = expression.getLoc()
    return (
      expressionPosition.start.column === selection.start.column &&
      expressionPosition.start.line === selection.start.line &&
      expressionPosition.end.column === selection.end.column &&
      expressionPosition.end.line === selection.end.line
    )
  }

  return allExpressions.find(isSearchedExpression)
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
  }).sort((previousExpression, nextExpression) => {
    const previousRange = previousExpression.getRange()
    const nextRange = nextExpression.getRange()
    return (previousRange[1] - previousRange[0]) - (nextRange[1] - nextRange[0])
  })
}

export function findExpressions (code: string, selection: selection, {depth = 0} : {depth?: number}): Array<expression> {
  const ast = parse(code)
  const normalizedSelection = normalizeSelection(selection)
  const expressions = findExpressionsAt(ast, normalizedSelection).map(expression => ({
    value: expression.getSourceCode(),
    selection: denormalizeSelection(expression.getLoc())
  }))
  if (depth === 0) depth = expressions.length + 1
  return expressions.slice(0, depth)
}

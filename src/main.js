// @flow
import * as babylon from 'babylon'
import traverse from 'babel-traverse'
import * as t from 'babel-types'
import {filter} from 'lodash'

export function parse (code: string): Object {
  return babylon.parse(code, {plugins: ['jsx', 'flow']})
}

function getPaths (ast: Object) {
  let paths = []

  traverse(ast, {
    enter (path) { if (t.isExpression(path.node)) paths.push(path) }
  })
  return paths
}

type position = { line: number, column: number }
type selection = { start: position, end: position }

function normalizePosition (position: position) {
  return { line: position.line + 1, column: position.column }
}

function getExpressions (paths) {
  return paths.map((path) => path.node)
}

function normalizeSelection (selection: selection) {
  return {
    start: normalizePosition(selection.start),
    end: normalizePosition(selection.end)
  }
}

export function expressionsAt (ast: Object, selection: selection) {
  const normalizedSelection = normalizeSelection(selection)
  const allExpressions = getExpressions(getPaths(ast))

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

function pathAt (ast: Object, selection: selection) {
  const normalizedSelection = normalizeSelection(selection)
  const allPaths = getPaths(ast)

  function isSearchedPath (path) {
    const expressionPosition = path.node.loc
    return (
      expressionPosition.start.column === normalizedSelection.start.column &&
      expressionPosition.start.line === normalizedSelection.start.line &&
      expressionPosition.end.column === normalizedSelection.end.column &&
      expressionPosition.end.line === normalizedSelection.end.line
    )
  }

  return filter(allPaths, isSearchedPath)[0]
}

export function extractVariable (ast: Object, selection: selection, code: string) {
  const path = pathAt(ast, selection)
  if (path) {
    const extractedCode = code.slice(path.node.start, path.node.end)
    let closestStatement = path.parentPath
    while (!closestStatement.node.body) {
      closestStatement = closestStatement.parentPath
    }
    const statementPositon = closestStatement.node.loc.start
    const identifier = '_ref'
    const insertedCode = `\nvar ${identifier} = ${extractedCode}\n`

    const operations = [
      {type: 'replace', selection, code: identifier},
      {type: 'add', statementPositon, code: insertedCode}
    ]
    return operations
  }
}

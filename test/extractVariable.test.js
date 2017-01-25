// @flow
import { extractVariable } from '../src/extractVariable'
import { ExpressionNotFoundError } from '../src/findExpressions'

describe('extractVariable', () => {
  const binaryExpression = `5 + 2`
  const expressionInsideFunction = `() => {\n  5 + 5\n}`

  function testExtractVariable (code, selection) {
    expect(extractVariable(code, selection)).toMatchSnapshot()
  }

  function testExtractVariableThrows (code, selection) {
    const extractVariableWithUnexistingExpression = () => {
      extractVariable(code, selection)
    }
    expect(extractVariableWithUnexistingExpression).toThrowError(new ExpressionNotFoundError())
  }

  test('correctly extracts variable', () => {
    testExtractVariable(binaryExpression, {start: {line: 0, column: 0}, end: {line: 0, column: 1}})
    testExtractVariable(binaryExpression, {start: {line: 0, column: 0}, end: {line: 0, column: 5}})
    testExtractVariable(binaryExpression, {start: {line: 0, column: 4}, end: {line: 0, column: 5}})
    testExtractVariable(expressionInsideFunction, {start: {line: 1, column: 2}, end: {line: 1, column: 3}})
    testExtractVariable(expressionInsideFunction, {start: {line: 1, column: 6}, end: {line: 1, column: 7}})
    testExtractVariable(expressionInsideFunction, {start: {line: 1, column: 2}, end: {line: 1, column: 7}})
  })

  test('throws when selection is not an expression', () => {
    testExtractVariableThrows(binaryExpression, {start: {line: 1, column: 4}, end: {line: 0, column: 5}})
    testExtractVariableThrows(binaryExpression, {start: {line: 0, column: 0}, end: {line: 0, column: 2}})
  })
})

// @flow
import { extractVariable } from '../src/extractVariable'

describe('extractVariable', () => {
  const binaryExpression = `5 + 2`

  function testExtractVariable (code, location) {
    expect(extractVariable(code, location)).toMatchSnapshot()
  }

  test('correctly extracts variable', () => {
    testExtractVariable(binaryExpression, {start: {line: 0, column: 0}, end: {line: 0, column: 1}})
    testExtractVariable(binaryExpression, {start: {line: 0, column: 0}, end: {line: 0, column: 5}})
    testExtractVariable(binaryExpression, {start: {line: 0, column: 4}, end: {line: 0, column: 5}})
  })
})

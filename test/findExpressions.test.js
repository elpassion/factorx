// @flow
import { findExpressions } from '../src/findExpressions'

describe('expressionsAt', () => {
  const binaryExpression = `5 + 2`

  function testfindExpressions (code, location) {
    expect(findExpressions(code, location, {})).toMatchSnapshot()
  }

  describe('at start of an expression', () => {
    test('returns all expressions containing the position', () => {
      testfindExpressions(binaryExpression, {start: {line: 0, column: 2}, end: {line: 0, column: 2}})
      testfindExpressions(binaryExpression, {start: {line: 0, column: 0}, end: {line: 0, column: 0}})
      testfindExpressions(binaryExpression, {start: {line: 0, column: 4}, end: {line: 0, column: 4}})
    })
  })

  describe('at end of an expression', () => {
    test('returns all expressions containing the position', () => {
      testfindExpressions(binaryExpression, {start: {line: 0, column: 1}, end: {line: 0, column: 1}})
      testfindExpressions(binaryExpression, {start: {line: 0, column: 3}, end: {line: 0, column: 3}})
      testfindExpressions(binaryExpression, {start: {line: 0, column: 5}, end: {line: 0, column: 5}})
    })
  })
})

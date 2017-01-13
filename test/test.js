// @flow
import {
  parse,
  expressionsAt,
  extractVariable
} from '../src/main'
import * as exampleCode from './fixtures'

describe('expressionsAt', () => {
  describe('not during selection', () => {
    describe('at start of an expression', () => {
      test('returns all expressions containing the position', () => {
        const location = {start: {line: 0, column: 0}, end: {line: 0, column: 0}}
        const ast = parse(exampleCode.binaryExpression)
        expect(expressionsAt(ast, location)).toMatchSnapshot()

        const location2 = {start: {line: 0, column: 2}, end: {line: 0, column: 2}}
        const ast2 = parse(exampleCode.binaryExpression)
        expect(expressionsAt(ast2, location2)).toMatchSnapshot()

        const location3 = {start: {line: 0, column: 4}, end: {line: 0, column: 4}}
        const ast3 = parse(exampleCode.binaryExpression)
        expect(expressionsAt(ast3, location3)).toMatchSnapshot()
      })
    })

    describe('at end of an expression', () => {
      const ast = parse(exampleCode.binaryExpression)
      test('returns all expressions containing the position', () => {
        const location = {start: {line: 0, column: 1}, end: {line: 0, column: 1}}
        expect(expressionsAt(ast, location)).toMatchSnapshot()
        const location2 = {start: {line: 0, column: 3}, end: {line: 0, column: 3}}
        expect(expressionsAt(ast, location2)).toMatchSnapshot()
        const location3 = {start: {line: 0, column: 5}, end: {line: 0, column: 5}}
        expect(expressionsAt(ast, location3)).toMatchSnapshot()
      })
    })
  })
})

describe('extractVariable', () => {
  test('returns an array of diffs needed to be made to extract variable', () => {
    const location = {start: {line: 0, column: 0}, end: {line: 0, column: 1}}
    const code = exampleCode.binaryExpression
    const ast = parse(code)
    expect(extractVariable(ast, location, code)).toMatchSnapshot()
  })
})

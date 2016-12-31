// @flow
import {
  extractVariable,
  parse,
  expressionAt,
  expressionsAt
} from '../src/main'
import * as exampleCode from './fixtures'

describe('expressionsAt', () => {
  describe('not during selection', () => {
    describe('at start of an expression', () => {
      test('returns all expressions containing the position', () => {
        const location = {start: {line: 0, column: 0}, end: {line: 0, column: 0}}
        const ast = parse(exampleCode.binaryExpression)
        expect(expressionsAt(ast, location).map(node => node.getSourceCode())).toEqual(['5 + 2', '5'])

        const location2 = {start: {line: 0, column: 2}, end: {line: 0, column: 2}}
        const ast2 = parse(exampleCode.binaryExpression)
        expect(expressionsAt(ast2, location2).map(node => node.getSourceCode())).toEqual(['5 + 2'])

        const location3 = {start: {line: 0, column: 4}, end: {line: 0, column: 4}}
        const ast3 = parse(exampleCode.binaryExpression)
        expect(expressionsAt(ast3, location3).map(node => node.getSourceCode())).toEqual(['5 + 2', '2'])
      })
    })

    describe('at end of an expression', () => {
      test('returns all expressions containing the position', () => {
        const location = {start: {line: 0, column: 1}, end: {line: 0, column: 1}}
        const ast = parse(exampleCode.binaryExpression)
        expect(expressionsAt(ast, location).map(node => node.getSourceCode())).toEqual(['5 + 2', '5'])

        const location2 = {start: {line: 0, column: 3}, end: {line: 0, column: 3}}
        const ast2 = parse(exampleCode.binaryExpression)
        expect(expressionsAt(ast2, location2).map(node => node.getSourceCode())).toEqual(['5 + 2'])

        const location3 = {start: {line: 0, column: 5}, end: {line: 0, column: 5}}
        const ast3 = parse(exampleCode.binaryExpression)
        expect(expressionsAt(ast3, location3).map(node => node.getSourceCode())).toEqual(['5 + 2', '2'])
      })
    })
  })
})

describe('expressionAt', () => {
  const ast = parse(exampleCode.binaryExpression)
  describe('when a specified expression exists', () => {
    test('returns the expression', () => {
      const selection = {start: {line: 0, column: 0}, end: {line: 0, column: 1}}
      expect(expressionAt(ast, selection).getSourceCode()).toEqual('5')
    })
  })
  describe('when a specified expression does not exist', () => {
    xtest('throws an error', () => {
      const wrongSelection = {start: {line: 0, column: 0}, end: {line: 0, column: 2}}
      expect(expressionAt(ast, wrongSelection)).toThrow()
    })
  })
})

test('extractVariable', () => {
  let location
  location = {start: {line: 0, column: 0}, end: {line: 0, column: 1}}
  expect(extractVariable(exampleCode.binaryExpression, location, 'let', 'number').getSourceCode()).toMatchSnapshot()
  location = {start: {line: 0, column: 0}, end: {line: 0, column: 5}}
  expect(extractVariable(exampleCode.binaryExpression, location, 'let', 'number').getSourceCode()).toMatchSnapshot()
  location = {start: {line: 0, column: 4}, end: {line: 0, column: 5}}
  expect(extractVariable(exampleCode.binaryExpression, location, 'let', 'number').getSourceCode()).toMatchSnapshot()
})

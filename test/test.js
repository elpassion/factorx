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
        const location = {cursorStart: {line: 0, column: 0}, cursorEnd: {line: 0, column: 0}}
        const ast = parse(exampleCode.binaryExpression)
        expect(expressionsAt(ast, location).map(node => node.getSourceCode())).toEqual(['5 + 2', '5'])

        const location2 = {cursorStart: {line: 0, column: 2}, cursorEnd: {line: 0, column: 2}}
        const ast2 = parse(exampleCode.binaryExpression)
        expect(expressionsAt(ast2, location2).map(node => node.getSourceCode())).toEqual(['5 + 2'])

        const location3 = {cursorStart: {line: 0, column: 4}, cursorEnd: {line: 0, column: 4}}
        const ast3 = parse(exampleCode.binaryExpression)
        expect(expressionsAt(ast3, location3).map(node => node.getSourceCode())).toEqual(['5 + 2', '2'])
      })
    })

    describe('at end of an expression', () => {
      const ast = parse(exampleCode.binaryExpression)
      test('returns all expressions containing the position', () => {
        const location = {cursorStart: {line: 0, column: 1}, cursorEnd: {line: 0, column: 1}}
        expect(expressionsAt(ast, location).map(node => node.getSourceCode())).toEqual(['5 + 2', '5'])
        const location2 = {cursorStart: {line: 0, column: 3}, cursorEnd: {line: 0, column: 3}}
        expect(expressionsAt(ast, location2).map(node => node.getSourceCode())).toEqual(['5 + 2'])
        const location3 = {cursorStart: {line: 0, column: 5}, cursorEnd: {line: 0, column: 5}}
        expect(expressionsAt(ast, location3).map(node => node.getSourceCode())).toEqual(['5 + 2', '2'])
      })
    })
  })
})

describe('expressionAt', () => {
  const ast = parse(exampleCode.binaryExpression)
  describe('when a specified expression exists', () => {
    test('returns the expression', () => {
      const selection = {cursorStart: {line: 0, column: 0}, cursorEnd: {line: 0, column: 1}}
      expect(expressionAt(ast, selection).getSourceCode()).toEqual('5')
    })
  })
  describe('when a specified expression does not exist', () => {
    xtest('throws an error', () => {
      const wrongSelection = {cursorStart: {line: 0, column: 0}, cursorEnd: {line: 0, column: 2}}
      expect(expressionAt(ast, wrongSelection)).toThrow()
    })
  })
})

test('extractVariable', () => {
  let location
  location = {cursorStart: {line: 0, column: 0}, cursorEnd: {line: 0, column: 1}}
  expect(extractVariable(exampleCode.binaryExpression, location, 'let', 'number').getSourceCode()).toMatchSnapshot()
  location = {cursorStart: {line: 0, column: 0}, cursorEnd: {line: 0, column: 5}}
  expect(extractVariable(exampleCode.binaryExpression, location, 'let', 'number').getSourceCode()).toMatchSnapshot()
  location = {cursorStart: {line: 0, column: 4}, cursorEnd: {line: 0, column: 5}}
  expect(extractVariable(exampleCode.binaryExpression, location, 'let', 'number').getSourceCode()).toMatchSnapshot()
})

// @flow
import {tokenAt, extractVariable, parse} from '../src/main'
import * as exampleCode from './fixtures'

test('tokenAt', () => {
  const ast = parse(exampleCode.binaryExpression)
  expect(tokenAt(ast, 1, 1).value).toEqual(5)
  expect(tokenAt(ast, 1, 5).value).toEqual(2)

  const ast2 = parse(exampleCode.multiLineExpression)
  expect(tokenAt(ast2, 2, 1).value).toEqual(5)
  expect(tokenAt(ast2, 3, 1).value).toEqual('const')
  expect(tokenAt(ast2, 3, 2).value).toEqual('const')
  expect(tokenAt(ast2, 3, 7).value).toEqual('name')
  expect(tokenAt(ast2, 3, 14).value).toEqual(5)
})

test('extractVariable', () => {
  expect(extractVariable(exampleCode.binaryExpression, 1, 1, 'let', 'number').getSourceCode()).toMatchSnapshot()
  expect(extractVariable(exampleCode.binaryExpression, 1, 5, 'let', 'number').getSourceCode()).toMatchSnapshot()
  expect(extractVariable(exampleCode.binaryExpressionString, 1, 1, 'let', 'string').getSourceCode()).toMatchSnapshot()
  expect(extractVariable(exampleCode.binaryExpressionString, 1, 10, 'const', 'text').getSourceCode()).toMatchSnapshot()
  expect(extractVariable(exampleCode.binaryExpressionString, 1, 10, 'var', 'varText').getSourceCode()).toMatchSnapshot()
  expect(extractVariable(exampleCode.binaryExpressionString, 1, 6, 'let', 'addition').getSourceCode()).toMatchSnapshot()
})

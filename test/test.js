// @flow
import {tokenAt, extractVariable, parse} from '../src/main'

test('tokenAt', () => {
  const code = `5 + 2`
  const ast = parse(code)
  expect(tokenAt(ast, 1, 1).value).toEqual(5)
  expect(tokenAt(ast, 1, 5).value).toEqual(2)

  const code2 = `
5 + 2
const name = 5
  `
  const ast2 = parse(code2)
  expect(tokenAt(ast2, 2, 1).value).toEqual(5)
  expect(tokenAt(ast2, 3, 1).value).toEqual('const')
  expect(tokenAt(ast2, 3, 2).value).toEqual('const')
  expect(tokenAt(ast2, 3, 7).value).toEqual('name')
  expect(tokenAt(ast2, 3, 14).value).toEqual(5)
})

test('extractVariable', () => {
  const code = `5 + 2`
  expect(extractVariable(code, 1, 1, 'let', 'number').getSourceCode()).toMatchSnapshot()
  expect(extractVariable(code, 1, 5, 'let', 'number').getSourceCode()).toMatchSnapshot()
  const code2 = `'abc' + 'cde'`
  expect(extractVariable(code2, 1, 1, 'let', 'string').getSourceCode()).toMatchSnapshot()
  expect(extractVariable(code2, 1, 10, 'const', 'text').getSourceCode()).toMatchSnapshot()
  expect(extractVariable(code2, 1, 10, 'var', 'varText').getSourceCode()).toMatchSnapshot()
  expect(extractVariable(code2, 1, 6, 'let', 'addition').getSourceCode()).toMatchSnapshot()
})

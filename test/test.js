// @flow
import {tokenAt} from '../src/main'
const cst = require('cst')

test('tokenAt', () => {
  const code = `5 + 2`
  const parsedCode = new cst.Parser().parse(code)
  expect(tokenAt(parsedCode, 1, 1).value).toEqual(5)
  expect(tokenAt(parsedCode, 1, 5).value).toEqual(2)

  const code2 = `
5 + 2
const name = 5
  `
  const parsedCode2 = new cst.Parser().parse(code2)
  expect(tokenAt(parsedCode2, 2, 1).value).toEqual(5)
  expect(tokenAt(parsedCode2, 3, 1).value).toEqual('const')
  expect(tokenAt(parsedCode2, 3, 2).value).toEqual('const')
  expect(tokenAt(parsedCode2, 3, 7).value).toEqual('name')
  expect(tokenAt(parsedCode2, 3, 14).value).toEqual(5)
})

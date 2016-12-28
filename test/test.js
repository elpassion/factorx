// @flow
import {tokenAt} from '../src/main'
const cst = require('cst')

test('test', () => {
  const code = `5 + 2`
  const parsedCode = new cst.Parser().parse(code)
  expect(tokenAt(parsedCode, 1, 0).value).toEqual(5)
  expect(tokenAt(parsedCode, 1, 4).value).toEqual(2)
})

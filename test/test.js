// @flow
import {tokenAt, extract} from '../src/main'
const cst = require('cst')

test('tokenAt', () => {
  const code = `5 + 2`
  expect(tokenAt(code, 1, 1).value).toEqual(5)
  expect(tokenAt(code, 1, 5).value).toEqual(2)

  const code2 = `
5 + 2
const name = 5
  `
  expect(tokenAt(code2, 2, 1).value).toEqual(5)
  expect(tokenAt(code2, 3, 1).value).toEqual('const')
  expect(tokenAt(code2, 3, 2).value).toEqual('const')
  expect(tokenAt(code2, 3, 7).value).toEqual('name')
  expect(tokenAt(code2, 3, 14).value).toEqual(5)
})

test('extract', () => {
  const code = `5 + 2`
  expect(extract(code, 1, 1).getSourceCode()).toMatchSnapshot()
  expect(extract(code, 1, 5).getSourceCode()).toMatchSnapshot()
})

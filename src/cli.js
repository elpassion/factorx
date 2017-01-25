#! /usr/bin/env node
// @flow
import 'babel-polyfill'
import program from 'commander'
import getStdin from 'get-stdin'
import {findExpressions, extractVariable} from '../lib/main'

(() => {
  program
  .command('get-expressions <startLine> <startColumn> <endLine> <endColumn>')
  .option('-d, --depth [depth]', 'set the depth the expressions should be looked for')
  .option('-e, --exact [exact]', 'should it search for expressions in exact passed selection')
  .description('get expressions at range')
  .action((startLine, startColumn, endLine, endColumn, {depth, exact}) => {
    const options = {
      depth: depth ? parseInt(depth) : 0,
      exact: exact === 'true'
    }
    const selection = createSelection(startLine, startColumn, endLine, endColumn)
    getExpressionsCmd(selection, options)
  })

  program
  .command('extract-variable <startLine> <startColumn> <endLine> <endColumn>')
  .description('extract variable at range')
  .action((startLine, startColumn, endLine, endColumn) => {
    const selection = createSelection(startLine, startColumn, endLine, endColumn)
    extractVariableCmd(selection)
  })

  program
  .version('0.0.1')
  .parse(process.argv)

  function createSelection (startLine, startColumn, endLine, endColumn) {
    return {
      start: { line: parseInt(startLine), column: parseInt(startColumn) },
      end: { line: parseInt(endLine), column: parseInt(endColumn) }
    }
  }

  async function getExpressionsCmd (selection, options) {
    const file = await getStdin()
    try {
      const expressions = findExpressions(file, selection, options)
      writeJSON({status: 'ok', expressions})
    } catch (error) {
      writeJSON(createMessageFromError(error))
    }
  }

  async function extractVariableCmd (selection) {
    const file = await getStdin()
    try {
      const code = extractVariable(file, selection)
      writeJSON({status: 'ok', code})
    } catch (error) {
      writeJSON(createMessageFromError(error))
    }
  }

  function createMessageFromError ({name, message}) {
    const status = 'error'
    switch (name) {
      case 'ExpressionNotFound': {
        return {status, error: {name, message}}
      } case 'SyntaxError': {
        return {status, error: {name, message: 'Unable to parse the code'}}
      } default: {
        return {status, error: {name, message}}
      }
    }
  }

  function writeJSON (message) {
    process.stdout.write(JSON.stringify(message))
  }
})()

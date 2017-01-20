#! /usr/bin/env node
// @flow
const program = require('commander')
const getStdin = require('get-stdin')

const {
  findExpressions,
  extractVariable
} = require('../lib/main')

program
  .version('0.0.1')
  .command('get-expressions <startLine> <startColumn> <endLine> <endColumn>')
  .option('-d, --depth [depth]', 'set the depth the expressions should be looked for')
  .description('get expressions at range')
  .action((startLine, startColumn, endLine, endColumn, {depth}) => {
    const selection = {
      start: { line: parseInt(startLine), column: parseInt(startColumn) },
      end: { line: parseInt(endLine), column: parseInt(endColumn) }
    }

    const options = {
      depth: parseInt(depth)
    }

    getExpressionsCmd(selection, options)
  })

program
  .version('0.0.1')
  .command('extract-variable <startLine> <startColumn> <endLine> <endColumn>')
  .description('extract variable at range')
  .action((startLine, startColumn, endLine, endColumn) => {
    const selection = {
      start: { line: parseInt(startLine), column: parseInt(startColumn) },
      end: { line: parseInt(endLine), column: parseInt(endColumn) }
    }

    extractVariableCmd(selection)
  })

program.parse(process.argv)

function getExpressionsCmd (selection, options) {
  getStdin().then(file => {
    writeJSON({expressions: findExpressions(file, selection, options)})
  }).catch(err => console.log(err))
}

function extractVariableCmd (selection) {
  getStdin().then(file => {
    writeJSON({code: extractVariable(file, selection)})
  }).catch(err => console.log(err))
}

function writeJSON (message) {
  process.stdout.write(JSON.stringify(message))
}

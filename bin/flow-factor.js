#! /usr/bin/env node
// @flow
const program = require('commander')
const getStdin = require('get-stdin')

const {findExpressions} = require('../lib/main')

program
  .version('0.0.1')
  .command('get-expressions <startLine> <startColumn> <endLine> <endColumn>')
  .description('get expressions at range')
  .action((startLine, startColumn, endLine, endColumn) => {
    const selection = {
      start: { line: parseInt(startLine), column: parseInt(startColumn) },
      end: { line: parseInt(endLine), column: parseInt(endColumn) }
    }

    getExpressions(selection)
  })

program.parse(process.argv)

function getExpressions (selection) {
  getStdin().then(file => {
    writeJSON({expressions: findExpressions(file, selection)})
  }).catch(err => console.log(err))
}

function writeJSON (message) {
  process.stdout.write(JSON.stringify(message))
}

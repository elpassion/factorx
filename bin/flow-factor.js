#! /usr/bin/env node
// @flow
const program = require('commander')
const {expressionsAt, parse, extractVariable} = require('../lib/main')
const getStdin = require('get-stdin')

program
  .version('0.0.1')
  .command('getExpressions <startLine> <startColumn> <endLine> <endColumn>')
  .description('get expressions at range')
  .action((startLine, startColumn, endLine, endColumn) => {
    const selection = {
      start: { line: parseInt(startLine), column: parseInt(startColumn) },
      end: { line: parseInt(endLine), column: parseInt(endColumn) }
    }

    getExpressions(selection)
  })

program
  .command('getExtract <startLine> <startColumn> <endLine> <endColumn>')
  .description('extract selected variable')
  .action((startLine, startColumn, endLine, endColumn) => {
    const selection = {
      start: { line: parseInt(startLine), column: parseInt(startColumn) },
      end: { line: parseInt(endLine), column: parseInt(endColumn) }
    }

    getExtract(selection)
  })

program.parse(process.argv)

function denormalizePosition (position) {
  return { line: position.line - 1, column: position.column }
}

function denormalizeSelection (selection) {
  return {
    start: denormalizePosition(selection.start),
    end: denormalizePosition(selection.end)
  }
}

function getExpressions (selection) {
  function serializeExpressions (expressions, file) {
    return expressions.map(({start, end, loc}) => {
      const selection = denormalizeSelection(loc)
      return {
        value: file.slice(start, end),
        selection
      }
    })
  }

  getStdin()
  .then(file => {
    const ast = parse(file)
    const expressions = expressionsAt(ast, selection)
    const serializedExpressions = serializeExpressions(expressions, file)
    writeJSON({expressions: serializedExpressions})
  })
  .catch(err => console.log(err))
}

function getExtract (selection) {
  getStdin()
  .then(file => {
    const ast = parse(file)

    writeJSON(extractVariable(ast, selection, file))
  })
  .catch(err => console.log(err))
}

function writeJSON (message) {
  process.stdout.write(JSON.stringify(message))
}

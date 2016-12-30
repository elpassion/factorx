#! /usr/bin/env node
const {extractVariable} = require('../lib/main')

const argv = require('minimist')(process.argv.slice(2))
const location = {
  start: {
    line: parseInt(argv.startl), column: parseInt(argv.startc)
  },
  end: {
    line: parseInt(argv.endl), column: parseInt(argv.endc)
  }
}
const stdin = process.stdin
const stdout = process.stdout
const inputChunks = []

stdin.resume()
stdin.setEncoding('utf8')

stdin.on('data', function (chunk) {
  inputChunks.push(chunk)
})

stdin.on('end', function () {
  const file = inputChunks.join()
  stdout.write(JSON.stringify({
    newCode: extractVariable(file, location, argv.vark, argv.varn).getSourceCode()
  }))
})

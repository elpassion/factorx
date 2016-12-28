// @flow

export function tokenAt (ast: Object, line: number, column: number) {
  let token = ast.getFirstToken()
  while (token.getLoc().start.line !== line || token.getLoc().start.column !== column) {
    token = token.getNextToken()
  }
  return token
}

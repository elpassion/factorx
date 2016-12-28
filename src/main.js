// @flow

export function tokenAt (ast: Object, line: number, column: number) {
  function isInTokenColumnRange (token) {
    const {start, end} = token.getLoc()
    return start.column <= column && end.column >= column
  }

  function isInTokenLineRange (token) {
    return token.getLoc().start.line === line
  }

  let token = ast.getFirstToken()

  while (!isInTokenLineRange(token) || !isInTokenColumnRange(token)) {
    token = token.getNextToken()
  }
  return token
}

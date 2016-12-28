// @flow

export function tokenAt (ast: Object, line: number, column: number) {
  let token = ast.getFirstToken()

  function isInTokenColumnRange (token) {
    const {start, end} = token.getLoc()
    return start.column <= column && end.column >= column
  }

  while (token.getLoc().start.line !== line || !isInTokenColumnRange(token)) {
    token = token.getNextToken()
  }
  return token
}

type position = { line: number, column: number }
export type selection = { start: position, end: position }
export type expression = {
  value: string,
  selection: selection
}

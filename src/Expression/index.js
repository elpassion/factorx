// @flow

import Position from '../Position';

export default class Expression {
  value: string;
  position: Position;

  constructor(value: string, start: number, end: number) {
    this.value = value;
    this.position = new Position(start, end);
  }

  static fromNode(node: Object, code: string): Expression {
    return new Expression(code.slice(node.start, node.end), node.start, node.end);
  }
}

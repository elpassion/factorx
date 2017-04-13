// @flow

export default class Position {
  start: number;
  end: number;

  constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }

  static fromNode(node: Object) {
    return new Position(node.start, node.end);
  }

  isBlank() {
    return this.start === this.end;
  }

  equalToPosition(otherPosition: Position) {
    return otherPosition.start === this.start && otherPosition.end === this.end;
  }

  includesPosition(otherPosition: Position) {
    return otherPosition.start <= this.start && otherPosition.end >= this.end;
  }

  includes(otherPosition: Position) {
    return (this.isBlank() && this.includesPosition(otherPosition)) ||
      this.equalToPosition(otherPosition);
  }
}

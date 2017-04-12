// @flow

export default class Position {
  start: number;
  end: number;

  constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }

  isBlank() {
    return this.start === this.end;
  }

  equalToPosition(otherPosition: Object) {
    return otherPosition.start === this.start && otherPosition.end === this.end;
  }

  includesPosition(otherPosition: Object) {
    return otherPosition.start <= this.start && otherPosition.end >= this.end;
  }

  includes(otherPosition: Object) {
    return (this.isBlank() && this.includesPosition(otherPosition)) ||
      this.equalToPosition(otherPosition);
  }
}

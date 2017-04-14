// @flow
import reduceRight from 'lodash/reduceRight';

import type { selection } from './types';

function changeLocationLine({ line, column }, diff) {
  return { line: line + diff, column };
}

export function normalizeSelection({ start, end }: selection): selection {
  return { start: changeLocationLine(start, 1), end: changeLocationLine(end, 1) };
}

export function denormalizeSelection({ start, end }: selection): selection {
  return {
    start: changeLocationLine(start, -1),
    end: changeLocationLine(end, -1),
  };
}

export function rotateArray(array: Array<any>): Array<any> {
  return reduceRight(array, (acc, node) => acc.concat([node]), []);
}

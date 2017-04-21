// @flow
import _ from 'lodash';

// eslint-disable-next-line import/prefer-default-export
export function rotateArray<T>(array: Array<T>): Array<T> {
  return _.reduceRight(array, (acc, node) => acc.concat([node]), []);
}

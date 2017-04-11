// @flow
import * as babylon from 'babylon';
import traverse from 'babel-traverse';
import * as types from 'babel-types';
import Position from './Position';
import Expression from './Expression';

function parse(code: string): Object {
  return babylon.parse(code, {});
}

function serializeNode(node: Object, code: string): Expression {
  return Expression.fromNode(node, code);
}

export default function findExpressions(code: string, selection: Position): Array<Expression> {
  const nodes = [];
  traverse(parse(code), {
    enter(path) {
      const { node } = path;
      if (types.isExpression(node) && selection.start >= node.start && selection.end <= node.end) {
        nodes.push(node);
      }
    },
  });
  return nodes.map(node => serializeNode(node, code));
}

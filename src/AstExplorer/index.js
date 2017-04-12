// @flow

import * as babel from 'babel-core';
import Position from '../Position';
import Expression from '../Expression';
import ExpressionNotFoundError from '../ExpressionNotFoundError';
import options from './options';

export default class AstExplorer {
  code: string;
  ast: Object;
  map: Object;
  stop: Function;
  program: Object;

  constructor(input: string) {
    const { code, map, ast } = babel.transform(input, options);
    this.code = code;
    this.map = map;
    this.ast = ast;
  }

  serializeNode = (node: Object) => Expression.fromNode(this.code, node);

  findExpressions(selection: Position): Array<Expression> {
    const nodes = [];
    this.transform(() => ({
      visitor: {
        Expression(path) {
          if (path.node.start <= selection.start && path.node.end >= selection.end) {
            nodes.push(path.node);
          }
        },
      },
    }));
    if (nodes.length === 0) throw new ExpressionNotFoundError();
    return nodes.map(this.serializeNode);
  }

  transform(plugin: Function) {
    const { code, map, ast } = babel.transformFromAst(this.ast, this.code, {
      ...options,
      plugins: [plugin],
    });
    this.code = code;
    this.map = map;
    this.ast = ast;
  }
}

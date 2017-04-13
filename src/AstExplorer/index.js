// @flow

import * as babel from 'babel-core';
import Position from '../Position';
import Expression from '../Expression';
import ExpressionNotFoundError from '../ExpressionNotFoundError';
import options from './options';
import recast from 'recast';
import traverse from 'babel-traverse';
import * as types from 'babel-types';
import * as babylon from 'babylon';

export default class AstExplorer {
  code: string;
  ast: Object;
  map: Object;

  constructor(code: string) {
    this.code = code;
    this.ast = recast.parse(code, options);
  }

  serializeNode = (node: Object) => Expression.fromNode(this.code, node);

  findExpressions(selection: Position): Array<Expression> {
    const paths = [];
    this.transform(() => ({
      visitor: {
        Expression(path) {
          if (selection.includes(Position.fromNode(path.node))) {
            paths.push(path);
          }
        },
      },
    }));
    if (paths.length === 0) throw new ExpressionNotFoundError();
    let parentBlock = paths[paths.length - 1].scope.block;
    if (parentBlock.type === 'ArrowFunctionExpression' && paths.length !== 1) {
      parentBlock = parentBlock.body;
    }
    return paths
      .filter(path => parentBlock.start <= path.node.start && parentBlock.end >= path.node.end)
      .map(path => path.node)
      .map(this.serializeNode);
  }

  findExpressionOccurrences(selection: Position): Array<Expression> {
    const paths = [];
    this.transform(() => ({
      Expression(path) {
        if (selection.includes(Position.fromNode(path.node))) {
          path.scope.path.traverse({
            [path.node.type](expressionPath) {
              if (expressionPath.node.extra.raw === path.node.extra.raw) {
                paths.push(expressionPath);
              }
            },
          });
        }
      },
    }));
    if (paths.length === 0) throw new ExpressionNotFoundError();
    return paths.map(path => path.node).map(this.serializeNode);
  }

  extractVariable(selection: Position): string {
    let extracted = false;
    this.transform((programPath) => {
      programPath.traverse({
        Expression: (path) => {
          const { node } = path;
          if (!node.visited && selection.includes(Position.fromNode(path.node))) {
            node.visited = true;
            const id = path.scope.generateUidIdentifierBasedOnNode(node.id);
            path.scope.push({ id, init: path.node });
            path.replaceWith(types.identifier(id.name));
            extracted = true;
          }
        },
      });
    });
    if (!extracted) throw new ExpressionNotFoundError();
    return this.code;
  }

  transform(transformation: Function) {
    traverse(this.ast, {
      Program(programPath) {
        transformation(programPath);
      },
    });
    this.code = recast.print(this.ast).code;
  }
}

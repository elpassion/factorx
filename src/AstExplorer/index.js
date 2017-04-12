// @flow

import * as babel from 'babel-core';
import Position from '../Position';
import Expression from '../Expression';
import ExpressionNotFoundError from '../ExpressionNotFoundError';
import options from './options';
import recast from 'recast';

export default class AstExplorer {
  code: string;
  ast: Object;
  map: Object;
  stop: Function;

  constructor(input: string) {
    // const ast = babylon.parse(input, {
    // parser: {
    // parse(source) {
    // return recast.parse(source);
    // },
    // },
    // });
    const ast = recast.parse(input, options);
    console.log(ast);
    console.log(recast.print(ast, options, input));

    // const { code, map, ast } = babel.transform(input, options);
    // this.code = code;
    // this.map = map;
    // this.ast = ast;
  }

  serializeNode = (node: Object) => Expression.fromNode(this.code, node);

  findExpressions(selection: Position): Array<Expression> {
    const paths = [];
    this.transform(() => ({
      visitor: {
        Expression(path) {
          if (selection.includes(path.node)) {
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
      visitor: {
        Expression(path) {
          if (selection.includes(path.node)) {
            path.scope.path.traverse({
              [path.node.type](expressionPath) {
                if (expressionPath.node.extra.raw === path.node.extra.raw) {
                  paths.push(expressionPath);
                }
              },
            });
          }
        },
      },
    }));
    if (paths.length === 0) throw new ExpressionNotFoundError();
    return paths.map(path => path.node).map(this.serializeNode);
  }

  extractVariable(selection: Position): string {
    let extracted = false;
    this.transform(({ types }) => ({
      visitor: {
        Expression: (path) => {
          const { node } = path;
          if (!node.visited && selection.includes(node)) {
            node.visited = true;
            const id = path.scope.generateUidIdentifierBasedOnNode(node.id);
            path.scope.push({ id, init: path.node });
            path.replaceWith(types.identifier(id.name));
            extracted = true;
          }
        },
      },
    }));
    if (!extracted) throw new ExpressionNotFoundError();
    return this.code;
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

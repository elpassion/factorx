// @flow

import recast from 'recast';
import traverse from 'babel-traverse';
import * as types from 'babel-types';
import { rotateArray } from '../helpers';
import Position from '../Position';
import Expression from '../Expression';
import ExpressionNotFoundError from '../ExpressionNotFoundError';
import options from './options';

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
    this.transform((programPath) => {
      programPath.traverse({
        Expression(path) {
          if (selection.includes(Position.fromNode(path.node))) {
            paths.push(path);
          }
        },
      });
    });
    if (paths.length === 0) throw new ExpressionNotFoundError();
    let parentBlock = paths[paths.length - 1].scope.block;
    if (parentBlock.type === 'ArrowFunctionExpression' && paths.length !== 1) {
      parentBlock = parentBlock.body;
    }
    return rotateArray(
      paths
        .filter(path => parentBlock.start <= path.node.start && parentBlock.end >= path.node.end)
        .map(path => path.node)
        .map(this.serializeNode),
    );
  }

  findExpressionOccurrences(selection: Position): Array<Expression> {
    const paths = [];
    this.transform((programPath) => {
      programPath.traverse({
        Expression(path) {
          const nodePosition = Position.fromNode(path.node);
          if (selection.includes(nodePosition)) {
            paths.push(path);
            path.scope.path.traverse({
              [path.node.type](expressionPath) {
                if (
                  !nodePosition.includes(Position.fromNode(expressionPath.node)) &&
                  types.isNodesEquivalent(expressionPath.node, path.node)
                ) {
                  paths.push(expressionPath);
                }
              },
            });
          }
          return undefined;
        },
      });
    });
    if (paths.length === 0) throw new ExpressionNotFoundError();
    return paths.map(path => path.node).map(this.serializeNode);
  }

  extractMultipleVariables(
    selections: Array<Position>,
  ): { code: string, identifierPosition: Position | typeof undefined } {
    let replacedNodesCount = 0;
    const road = [];
    let identifierPosition;
    let identifier;

    this.transform((programPath) => {
      const firstSelection = selections[0];
      programPath.traverse({
        Expression: (path) => {
          const { node } = path;
          if (!node.visited && firstSelection.includes(Position.fromNode(node))) {
            node.visited = true;
            identifier = path.scope.generateUidIdentifierBasedOnNode(node.id);
            path.scope.push({ id: identifier, init: node });
            let roadPath = path.scope.path;
            road.push(roadPath.key);
            while (roadPath.key !== 'program') {
              roadPath = roadPath.parentPath;
              road.push(roadPath.key);
            }
            path.scope.path.traverse({
              Expression: (selectionPath) => {
                if (
                  selections.find(selection =>
                    selection.includes(Position.fromNode(selectionPath.node))) &&
                  !(selectionPath.parent &&
                    selectionPath.parent.type === 'VariableDeclarator' &&
                    selectionPath.parent.id === identifier)
                ) {
                  replacedNodesCount += 1;
                  selectionPath.replaceWith(types.identifier(identifier.name));
                }
              },
            });
          }
        },
      });
    });
    if (replacedNodesCount !== selections.length) throw new ExpressionNotFoundError();

    this.transform((programPath) => {
      let scope;
      if (road[0] === 'program') {
        scope = programPath.scope;
      } else {
        const roadPath = rotateArray(road.slice(0, -1).concat(['body'])).join('.');
        scope = programPath.get(roadPath).scope;
      }
      identifierPosition = Position.fromNode(scope.bindings[identifier.name].path.node.id);
    });

    return { code: this.code, identifierPosition };
  }

  extractVariable(
    selection: Position,
  ): { code: string, identifierPosition: Position | typeof undefined } {
    let extracted = false;
    const road = [];
    let identifierPosition;
    let identifier;

    this.transform((programPath) => {
      programPath.traverse({
        Expression: (path) => {
          const { node } = path;
          if (!node.visited && selection.includes(Position.fromNode(node))) {
            node.visited = true;
            identifier = path.scope.generateUidIdentifierBasedOnNode(node.id);
            path.scope.push({ id: identifier, init: node });
            path.replaceWith(types.identifier(identifier.name));
            extracted = true;
            let roadPath = path.scope.path;
            road.push(roadPath.key);
            while (roadPath.key !== 'program') {
              roadPath = roadPath.parentPath;
              road.push(roadPath.key);
            }
          }
        },
      });
    });

    if (!extracted) throw new ExpressionNotFoundError();

    this.transform((programPath) => {
      let scope;
      if (road[0] === 'program') {
        scope = programPath.scope;
      } else {
        const roadPath = rotateArray(road.slice(0, -1).concat(['body'])).join('.');
        scope = programPath.get(roadPath).scope;
      }
      identifierPosition = Position.fromNode(scope.bindings[identifier.name].path.node.id);
    });

    return { code: this.code, identifierPosition };
  }

  transform(transformation: Function) {
    traverse(this.ast, {
      Program(programPath) {
        transformation(programPath);
      },
    });
    this.code = recast.print(this.ast).code;
    this.ast = recast.parse(this.code, options);
  }
}

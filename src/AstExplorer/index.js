// @flow

import recast from 'recast';
import traverse from 'babel-traverse';
import * as types from 'babel-types';
import { rotateArray } from '../helpers';
import Position from '../Position';
import Expression from '../Expression';
import ExpressionNotFoundError from '../ExpressionNotFoundError';
import IdentifierNotFoundError from '../IdentifierNotFoundError';
import options from './options';
import ExtractMultipleVariablesOperation from './ExtractMultipleVariablesOperation';

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
    variableOptions: { type: 'const' | 'let' } = { type: 'let' },
  ): { code: string, cursorPosition: Position | typeof undefined } {
    return new ExtractMultipleVariablesOperation(
      this.ast,
      variableOptions.type,
      selections,
    ).start().result;
  }

  extractVariable(
    selection: Position,
    variableOptions: { type: 'const' | 'let' } = { type: 'let' },
  ): { code: string, cursorPosition: Position | typeof undefined } {
    let extracted = false;
    const road = [];
    let cursorPosition;
    let identifier;

    this.transform((programPath) => {
      programPath.traverse({
        Expression: (path) => {
          const { node } = path;
          if (!node.visited && selection.includes(Position.fromNode(node))) {
            node.visited = true;
            identifier = path.scope.generateUidIdentifierBasedOnNode(node.id);
            path.scope.push({ id: identifier, init: node, kind: variableOptions.type });
            path.replaceWith(types.identifier(identifier.name));
            extracted = true;
            let roadPath = path.scope.path;
            road.push(roadPath.key);
            while (roadPath.key !== 'program') {
              roadPath = roadPath.parentPath;
              if (types.isVariableDeclaration(roadPath)) road.push('declarations');
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
      const declarator = scope.bindings[identifier.name];
      const declaratorPath = declarator.path;
      const declarationPath = declaratorPath.parentPath;
      const firstReferencePath = declarator.referencePaths[0];
      const firstReferencePathParentStatement = firstReferencePath.getStatementParent();
      firstReferencePathParentStatement.insertBefore(types.clone(declarationPath.node));
      declarationPath.remove();
    });

    this.transform((programPath) => {
      let scope;
      if (road[0] === 'program') {
        scope = programPath.scope;
      } else {
        const roadPath = rotateArray(road.slice(0, -1).concat(['body'])).join('.');
        scope = programPath.get(roadPath).scope;
      }
      cursorPosition = Position.fromNode(scope.bindings[identifier.name].path.node.id);
    });

    return { code: this.code, cursorPosition };
  }

  renameIdentifier(selection: Position, newName: string) {
    let cursorPosition;
    let renamed = false;
    this.transform((programPath) => {
      programPath.traverse({
        Identifier(path) {
          const { node } = path;
          if (selection.includes(Position.fromNode(node))) {
            path.scope.rename(node.name, newName);
            const newNodeEnd = node.start + newName.length;
            cursorPosition = new Position(newNodeEnd, newNodeEnd);
            renamed = true;
          }
        },
      });
    });
    if (!renamed) throw new IdentifierNotFoundError();
    return { code: this.code, cursorPosition };
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

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
import ExtractVariablesOperation from './ExtractVariablesOperation';
import ExtractMethodOperation from './ExtractMethodOperation';

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
    const filteredPaths = rotateArray(
      paths
        .filter(path => parentBlock.start <= path.node.start && parentBlock.end >= path.node.end)
        .map(path => path.node)
        .map(this.serializeNode),
    );
    if (filteredPaths.length === 0) throw new ExpressionNotFoundError();
    return filteredPaths;
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

  extractVariable(
    selection: Position | Array<Position>,
    variableOptions: { type: 'const' | 'let' } = { type: 'let' },
  ): { code: string, cursorPositions: Array<Position> } {
    const selections = Array.isArray(selection) ? selection : [selection];
    return new ExtractVariablesOperation(this.ast, variableOptions.type, selections).start().result;
  }

  extractMethod(selections: Array<Position>): { code: string, cursorPositions: Array<Position> } {
    return new ExtractMethodOperation(this.ast, selections).start().result;
    // let declarationScopeRoad = [];
    // let cursorPositions = [];
    // const firstSelection = selections[0];
    // const getPathScope = path =>
    //   (types.isArrowFunctionExpression(path) ? path.scope.parent : path.scope);
    //
    // const findScopeRoad = (scope: Object) => {
    //   const scopeRoad = [];
    //   scope.path.find((path) => {
    //     scopeRoad.push(path.key);
    //     return types.isProgram(path);
    //   });
    //   return scopeRoad;
    // };
    //
    // this.transform((programPath) => {
    //   const addDeclarationToScope = (scope: Object, node: Object) => {
    //     const variableIdentifier = types.identifier('extracted');
    //     const functionExpression = types.arrowFunctionExpression(
    //       [],
    //       types.blockStatement([types.clone(node)]),
    //     );
    //     scope.push({ id: variableIdentifier, init: functionExpression, kind: 'const' });
    //   };
    //
    //   const replaceSelectionsInScope = (scope: Object) => {
    //     scope.path.traverse({
    //       Statement: (expressionPath) => {
    //         if (!expressionPath.node._generated) {
    //           const callExpression = types.callExpression(types.identifier('extracted'), []);
    //           const expressionStatement = types.expressionStatement(callExpression);
    //           expressionPath.replaceWith(expressionStatement);
    //           expressionPath.stop();
    //         } else {
    //           expressionPath.skip();
    //         }
    //       },
    //     });
    //   };
    //   programPath.traverse({
    //     Statement: (path) => {
    //       const { node } = path;
    //       if (!node.visited && firstSelection.includes(Position.fromNode(node))) {
    //         node.visited = true;
    //         const scope = getPathScope(path);
    //         addDeclarationToScope(scope, node);
    //         replaceSelectionsInScope(scope);
    //         declarationScopeRoad = findScopeRoad(scope);
    //       }
    //     },
    //   });
    // });
    // this.transform((programPath: Object) => {
    //   programPath.traverse({
    //     VariableDeclarator: (declaratorPath) => {
    //       if (
    //         isEqual(findScopeRoad(declaratorPath.scope), declarationScopeRoad) &&
    //         declaratorPath.node.id.name === 'extracted'
    //       ) {
    //         const { scope } = declaratorPath;
    //         const binding = scope.bindings.extracted;
    //         const referencePaths = binding.referencePaths.map(path => Position.fromNode(path.node));
    //         cursorPositions = [Position.fromNode(binding.path.node.id), ...referencePaths];
    //         programPath.stop();
    //       }
    //     },
    //   });
    // });
    // return { code: this.code, cursorPositions };
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

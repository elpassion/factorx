// @flow
import recast from 'recast';
import traverse from 'babel-traverse';
import * as types from 'babel-types';
import findIndex from 'lodash/findIndex';
import Position from '../Position';
import ExpressionNotFoundError from '../ExpressionNotFoundError';
import options from './options';

export default class ExtractMethodOperation {
  ast: Object;
  code: string;
  replacedNodesCount: number;
  scopeRoad: Array<any>;
  variableIdentifier: Object;
  selections: Array<Position>;
  selection: Position;
  cursorPositions: Array<Position>;

  constructor(ast: Object, selections: Array<Position>) {
    this.ast = ast;
    this.replacedNodesCount = 0;
    this.scopeRoad = [];
    this.selections = selections;
    this.selection = selections[0];
    this.cursorPositions = [];
    this.variableIdentifier = types.identifier('extracted');
  }

  getPathScope = (path: Object) =>
    (types.isArrowFunctionExpression(path) ? path.scope.parent : path.scope);

  findDeepestIncludingPath = (programPath: Object) => {
    const state = {};
    programPath.traverse({
      enter: (path) => {
        if (this.selection.includesPosition(Position.fromNode(path.node))) {
          state.deepestIncludedPath = path;
        } else {
          path.skip();
        }
      },
    });
    return state.deepestIncludedPath || programPath;
  };

  cloneSelectedNodes = (pathNodes: Array<Object>) => {
    let nodes = [...pathNodes];
    const startNodeIndex = findIndex(nodes, {
      start: this.selection.start,
    });
    const endNodeIndex =
      findIndex(nodes, {
        end: this.selection.end,
      }) + 1;
    nodes = nodes.slice(startNodeIndex, endNodeIndex);
    return nodes.map(node => types.clone(node));
  };

  buildExpressionStatement = () => {
    const callExpression = types.callExpression(this.variableIdentifier, []);
    return types.expressionStatement(callExpression);
  };

  removeSelectedNodes = (deepestIncludedPath: Object, clonedNodes: Array<Object>) => {
    let lastClonedNodeIndex = 0;
    const isExactlyTheFirstNode = otherNode =>
      types.isNodesEquivalent(clonedNodes[lastClonedNodeIndex], otherNode) &&
      Position.fromNode(clonedNodes[lastClonedNodeIndex]).equalToPosition(
        Position.fromNode(otherNode),
      );
    const statement = this.buildExpressionStatement();
    let insertedInvocation = false;
    if (!deepestIncludedPath) throw new ExpressionNotFoundError();
    deepestIncludedPath.traverse({
      enter: (path) => {
        if (isExactlyTheFirstNode(path.node)) {
          if (!insertedInvocation) {
            path.insertBefore(statement);
            insertedInvocation = true;
          }
          path.remove();
          lastClonedNodeIndex += 1;
        }
      },
    });
  };

  buildVariableDeclaration = (body) => {
    const functionExpression = types.arrowFunctionExpression([], body);
    return { id: this.variableIdentifier, init: functionExpression, kind: 'const' };
  };

  extractMultipleNodes = (deepestIncludedPath: Object) => {
    const scope = this.getPathScope(deepestIncludedPath);
    const nodes = this.cloneSelectedNodes(deepestIncludedPath.node.body);
    this.removeSelectedNodes(deepestIncludedPath, nodes);
    scope.push(this.buildVariableDeclaration(types.blockStatement(nodes)));
  };

  extractExpression = (deepestIncludedPath: Object) => {
    const scope = this.getPathScope(deepestIncludedPath);
    const node = deepestIncludedPath.node;
    scope.push(this.buildVariableDeclaration(types.clone(node)));
    deepestIncludedPath.replaceWith(this.buildExpressionStatement());
  };

  extractStatement = (deepestIncludedPath: Object) => {
    const scope = this.getPathScope(deepestIncludedPath);
    const node = types.blockStatement([types.clone(deepestIncludedPath.node)]);
    scope.push(this.buildVariableDeclaration(types.clone(node)));
    deepestIncludedPath.replaceWith(this.buildExpressionStatement());
  };

  extractMethod = (programPath: Object) => {
    const deepestIncludingPath = this.findDeepestIncludingPath(programPath);
    if (types.isBlock(deepestIncludingPath)) {
      this.extractMultipleNodes(deepestIncludingPath);
    } else if (types.isExpression(deepestIncludingPath)) {
      this.extractExpression(deepestIncludingPath);
    } else if (types.isStatement(deepestIncludingPath)) {
      this.extractStatement(deepestIncludingPath);
    }
  };

  start(): { ast: Object, result: { code: string, cursorPositions: Array<Position> } } {
    this.transform(this.extractMethod);

    return { ast: this.ast, result: { code: this.code, cursorPositions: this.cursorPositions } };
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

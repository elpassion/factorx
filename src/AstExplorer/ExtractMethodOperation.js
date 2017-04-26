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
  }

  // addDeclarationToScope = (scope: Object, node: Object) => {
  //   const variableIdentifier = types.identifier('extracted');
  //   const functionExpression = types.arrowFunctionExpression([], types.clone(node));
  //   scope.push({ id: variableIdentifier, init: functionExpression, kind: 'const' });
  // };

  // replaceSelectionsInScope = (scope: Object) => {
  //   scope.path.traverse(
  // {
  // Expression: (expressionPath) => {
  // console.log(expressionPath.node);
  // if (isSelectedExpression(expressionPath)) {
  // const callExpression = types.callExpression(types.identifier('extracted'), []);
  // const expressionStatement = types.expressionStatement(callExpression);
  // expressionPath.replaceWith(expressionStatement);
  // }
  // },
  //     },
  //   );
  // };

  getPathScope = (path: Object) =>
    (types.isArrowFunctionExpression(path) ? path.scope.parent : path.scope);

  extractMethod = (programPath: Object) => {
    const state = {};
    programPath.traverse(
      {
        enter: (path) => {
          if (this.selection.includesPosition(Position.fromNode(path.node))) {
            state.deepestIncludedPath = path;
          } else {
            path.skip();
          }
        },
      },
      state,
    );
    if (!state.deepestIncludedPath) {
      state.deepestIncludedPath = programPath;
      let nodes = [...state.deepestIncludedPath.node.body];
      const startNodeIndex = findIndex(state.deepestIncludedPath.node.body, {
        start: this.selection.start,
      });
      const endNodeIndex =
        findIndex(state.deepestIncludedPath.node.body, {
          end: this.selection.end,
        }) + 1;
      nodes = nodes.slice(startNodeIndex, endNodeIndex);
      const scope = this.getPathScope(state.deepestIncludedPath);
      const functionExpression = types.arrowFunctionExpression(
        [],
        types.blockStatement(nodes.map(node => types.clone(node))),
      );
      const isExactlyTheFirstNode = otherNode =>
        types.isNodesEquivalent(nodes[0], otherNode) &&
        Position.fromNode(nodes[0]).equalToPosition(Position.fromNode(otherNode));

      const callExpression = types.callExpression(types.identifier('extracted'), []);
      const expressionStatement = types.expressionStatement(callExpression);
      let insertedInvocation = false;
      if (!state.deepestIncludedPath) throw new ExpressionNotFoundError();
      state.deepestIncludedPath.traverse({
        enter: (path) => {
          if (isExactlyTheFirstNode(path.node)) {
            if (!insertedInvocation) {
              path.insertBefore(expressionStatement);
              insertedInvocation = true;
            }
            path.remove();
            nodes = nodes.slice(1);
          }
        },
      });
      const variableIdentifier = types.identifier('extracted');
      scope.push({ id: variableIdentifier, init: functionExpression, kind: 'const' });
    } else {
      const scope = this.getPathScope(state.deepestIncludedPath);
      const variableIdentifier = types.identifier('extracted');
      let node;
      if (types.isExpression(state.deepestIncludedPath.node)) node = state.deepestIncludedPath.node;
      else {
        node = types.blockStatement([types.clone(state.deepestIncludedPath.node)]);
      }
      const functionExpression = types.arrowFunctionExpression([], types.clone(node));
      scope.push({ id: variableIdentifier, init: functionExpression, kind: 'const' });
      const callExpression = types.callExpression(types.identifier('extracted'), []);
      const expressionStatement = types.expressionStatement(callExpression);
      state.deepestIncludedPath.replaceWith(expressionStatement);
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

// @flow
import recast from 'recast';
import traverse from 'babel-traverse';
import * as types from 'babel-types';
import isEqual from 'lodash/isEqual';
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

  addDeclarationToScope = (scope: Object, node: Object) => {
    const variableIdentifier = types.identifier('extracted');
    const functionExpression = types.arrowFunctionExpression([], types.clone(node));
    scope.push({ id: variableIdentifier, init: functionExpression, kind: 'const' });
  };

  replaceSelectionsInScope = (scope: Object) => {
    scope.path.traverse(
      {
        // Expression: (expressionPath) => {
        // console.log(expressionPath.node);
        // if (isSelectedExpression(expressionPath)) {
        // const callExpression = types.callExpression(types.identifier('extracted'), []);
        // const expressionStatement = types.expressionStatement(callExpression);
        // expressionPath.replaceWith(expressionStatement);
        // }
        // },
      },
    );
  };

  getPathScope = (path: Object) =>
    (types.isArrowFunctionExpression(path) ? path.scope.parent : path.scope);

  extractMethod = (programPath: Object) => {
    const state = {};
    programPath.traverse(
      {
        Expression: (path, state) => {
          const { node } = path;
          if (this.selections[0].includes(Position.fromNode(node))) {
          }
        },
      },
      state,
    );
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

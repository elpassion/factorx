// @flow
import recast from 'recast';
import traverse from 'babel-traverse';
import * as types from 'babel-types';
import isEqual from 'lodash/isEqual';
import Position from '../Position';
import ExpressionNotFoundError from '../ExpressionNotFoundError';
import options from './options';

export default class ExtractVariablesOperation {
  ast: Object;
  code: string;
  replacedNodesCount: number;
  scopeRoad: Array<any>;
  variableType: 'const' | 'let';
  variableIdentifier: Object;
  selections: Array<Position>;
  cursorPosition: Position;

  constructor(ast: Object, variableType: 'const' | 'let' = 'let', selections: Array<Position>) {
    this.ast = ast;
    this.replacedNodesCount = 0;
    this.scopeRoad = [];
    this.variableType = variableType;
    this.selections = selections;
  }

  isAllSelectionsExtracted() {
    return this.replacedNodesCount !== this.selections.length;
  }

  isSelectedExpression(expressionPath: Object) {
    const isExpressionIncluded = selection =>
      selection.includes(Position.fromNode(expressionPath.node));

    const isExpressionTheDeclaration = expressionPath.parent &&
      expressionPath.parent.type === 'VariableDeclarator' &&
      expressionPath.parent.id === this.variableIdentifier;

    return this.selections.find(
      selection => isExpressionIncluded(selection) && !isExpressionTheDeclaration,
    );
  }

  replaceSelectionsInScope(scope: Object) {
    scope.path.traverse({
      Expression: (expressionPath) => {
        if (this.isSelectedExpression(expressionPath)) {
          expressionPath.replaceWith(types.identifier(this.variableIdentifier.name));
          this.replacedNodesCount += 1;
        }
      },
    });
  }

  addDeclarationToScope(scope: Object, node: Object) {
    this.variableIdentifier = scope.generateUidIdentifierBasedOnNode(node.id);
    scope.push({ id: this.variableIdentifier, init: node, kind: this.variableType });
  }

  // eslint-disable-next-line class-methods-use-this
  findScopeRoad(scope: Object) {
    const scopeRoad = [];
    scope.path.find((path) => {
      scopeRoad.push(path.key);
      return types.isProgram(path);
    });
    return scopeRoad;
  }

  saveScopeRoad(scope: Object) {
    this.scopeRoad = this.findScopeRoad(scope);
  }

  extractVariable = (programPath: Object) => {
    const firstSelection = this.selections[0];
    programPath.traverse({
      Expression: (path) => {
        const { node, scope } = path;
        if (!node.visited && firstSelection.includes(Position.fromNode(node))) {
          node.visited = true;
          this.addDeclarationToScope(scope, node);
          this.replaceSelectionsInScope(scope);
          this.saveScopeRoad(scope);
          if (this.isAllSelectionsExtracted()) programPath.stop();
        }
      },
    });

    if (this.isAllSelectionsExtracted()) throw new ExpressionNotFoundError();
  };

  moveDeclaration = (programPath: Object) => {
    const traversalState = {};
    programPath.traverse(
      {
        VariableDeclarator: (declaratorPath, state) => {
          if (
            isEqual(this.findScopeRoad(declaratorPath.scope), this.scopeRoad) &&
            declaratorPath.node.id.name === this.variableIdentifier.name
          ) {
            const { scope } = declaratorPath;
            const binding = scope.bindings[this.variableIdentifier.name];
            const declarationPath = declaratorPath.parentPath;
            const firstReferencePath = binding.referencePaths[0];
            const firstReferencePathParentStatement = firstReferencePath.find(
              path =>
                types.isStatement(path) &&
                types.isNodesEquivalent(path.scope.path.node, scope.path.node),
            );
            //eslint-disable-next-line
            state.firstReferencePathParentStatement = firstReferencePathParentStatement;
            //eslint-disable-next-line
            state.replacement = types.clone(declarationPath.node);
            declarationPath.remove();
            programPath.stop();
          }
        },
      },
      traversalState,
    );
    traversalState.firstReferencePathParentStatement.insertBefore(traversalState.replacement);
  };

  setCursorPosition = (programPath: Object) => {
    programPath.traverse({
      VariableDeclarator: (declaratorPath) => {
        if (
          isEqual(this.findScopeRoad(declaratorPath.scope), this.scopeRoad) &&
          declaratorPath.node.id.name === this.variableIdentifier.name
        ) {
          const { scope } = declaratorPath;
          this.cursorPosition = Position.fromNode(
            scope.bindings[this.variableIdentifier.name].path.node.id,
          );
          programPath.stop();
        }
      },
    });
  };

  start(): { ast: Object, result: { code: string, cursorPosition: Position | typeof undefined } } {
    this.transform(this.extractVariable);
    this.transform(this.moveDeclaration);
    this.transform(this.setCursorPosition);

    return { ast: this.ast, result: { code: this.code, cursorPosition: this.cursorPosition } };
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

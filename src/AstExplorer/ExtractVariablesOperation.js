// @flow
import recast from 'recast';
import traverse from 'babel-traverse';
import * as types from 'babel-types';
import { isEqual } from 'lodash';
import Position from '../Position';
import ExpressionNotFoundError from '../ExpressionNotFoundError';
import options from './options';
import { referencePathsForVariableInScope, findScopeRoad } from './helpers';

export default class ExtractVariablesOperation {
  ast: Object;
  code: string;
  replacedNodesCount: number;
  scopeRoad: Array<any>;
  variableType: 'const' | 'let';
  variableIdentifier: Object;
  variableBinding: Object;
  selections: Array<Position>;
  cursorPositions: Array<Position> = [];
  scope: Object;

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

    const isExpressionTheDeclaration =
      expressionPath.parent &&
      expressionPath.parent.type === 'VariableDeclarator' &&
      expressionPath.parent.id === this.variableIdentifier;

    return this.selections.find(
      selection => isExpressionIncluded(selection) && !isExpressionTheDeclaration,
    );
  }

  refreshScope = (programPath: Object) => {
    let scope;
    programPath.traverse({
      Scope: (scopePath) => {
        if (isEqual(findScopeRoad(scopePath.scope), this.scopeRoad)) {
          scope = scopePath.scope;
        }
      },
    });
    this.scope = scope || programPath.scope;
    this.variableBinding = this.scope.getOwnBinding(this.variableIdentifier.name);
    this.saveScopeRoad();
    programPath.stop();
  };

  replaceSelectionsInScope() {
    this.scope.path.traverse({
      Expression: (expressionPath) => {
        if (this.isSelectedExpression(expressionPath)) {
          expressionPath.replaceWith(types.identifier(this.variableIdentifier.name));
          this.replacedNodesCount += 1;
        }
      },
    });
    this.scope.crawl();
    this.variableBinding = this.scope.getOwnBinding(this.variableIdentifier.name);
  }

  addDeclarationToScope(path: Object) {
    const { scope, variableType: kind } = this;
    if (path.isMemberExpression()) {
      const { node } = path;
      const id = scope.generateUidIdentifierBasedOnNode(node.id);
      scope.push({ id, init: node, kind });
      const variableDeclarator = types.variableDeclarator(
        types.objectPattern([
          types.objectProperty(types.clone(node.property), types.clone(node.property), false, true),
        ]),
        node.object,
      );
      scope.getOwnBinding(id.name).path.replaceWith(variableDeclarator);
      this.variableIdentifier = node.property;
      scope.crawl();
    } else {
      const { node } = path;
      this.variableIdentifier = scope.generateUidIdentifierBasedOnNode(node.id);
      scope.push({ id: this.variableIdentifier, init: node, kind });
    }
    this.variableBinding = scope.getOwnBinding(this.variableIdentifier.name);
  }

  saveScopeRoad() {
    this.scopeRoad = findScopeRoad(this.scope);
  }

  extractVariable = (programPath: Object) => {
    // eslint-disable-next-line no-confusing-arrow
    const getPathScope = path =>
      path.isArrowFunctionExpression() ? path.scope.parent : path.scope;

    const firstSelection = this.selections[0];

    programPath.traverse({
      Expression: (path) => {
        const { node } = path;
        if (!node.visited && firstSelection.includes(Position.fromNode(node))) {
          this.scope = getPathScope(path);
          node.visited = true;
          this.addDeclarationToScope(path);
          this.replaceSelectionsInScope();
          this.saveScopeRoad();
          if (this.isAllSelectionsExtracted()) programPath.stop();
        }
      },
    });

    if (this.isAllSelectionsExtracted()) throw new ExpressionNotFoundError();
  };

  moveDeclaration = () => {
    const { scope, variableIdentifier: { name }, variableBinding } = this;
    const referencePaths = referencePathsForVariableInScope(scope, name);
    const firstReferencePath = referencePaths[0];
    const firstReferencePathParentStatement = firstReferencePath.find(
      path => path.isStatement() && types.isNodesEquivalent(path.scope.path.node, scope.path.node),
    );
    const declarationPath = variableBinding.path.parentPath;
    const newDeclaration = types.clone(declarationPath.node);
    declarationPath.remove();
    firstReferencePathParentStatement.insertBefore(newDeclaration);
    scope.crawl();
    this.variableBinding = scope.getOwnBinding(this.variableIdentifier.name);
  };

  mergeDeclarations = () => {
    const { scope, variableBinding: binding } = this;
    if (types.isObjectPattern(binding.path.node.id)) {
      const bindingsWithSameInit = Object.values(scope.bindings).filter((nextBinding: any) =>
        types.isNodesEquivalent(binding.path.node.init, nextBinding.path.node.init),
      );
      const highestBinding = (bindingsWithSameInit[0]: any);
      if (binding !== highestBinding) {
        const clonedProperty = types.clone(binding.path.node.id.properties[0]);
        binding.path.remove();
        highestBinding.path.traverse({
          ObjectPattern: (opPath) => {
            opPath.pushContainer('properties', clonedProperty);
            highestBinding.path.stop();
          },
        });
      }
    }
  };

  setCursorPosition = () => {
    const { scope, variableIdentifier: { name } } = this;
    const referencePaths = referencePathsForVariableInScope(scope, name);
    const referencePositions = referencePaths.map(path => Position.fromNode(path.node));
    this.cursorPositions = [Position.fromBinding(this.variableBinding), ...referencePositions];
  };

  start(): { ast: Object, result: { code: string, cursorPositions: Array<Position> } } {
    this.transform([this.extractVariable, this.moveDeclaration, this.mergeDeclarations]);
    this.recast();
    this.setCursorPosition();

    return { ast: this.ast, result: { code: this.code, cursorPositions: this.cursorPositions } };
  }

  recast() {
    this.code = recast.print(this.ast).code;
    this.ast = recast.parse(this.code, options);
    this.transform([this.refreshScope]);
  }

  transform(transformations: Array<Function>) {
    traverse(this.ast, {
      Program(programPath) {
        transformations.forEach((transformation) => {
          transformation(programPath);
        });
      },
    });
  }
}

// @flow
import recast from 'recast';
import traverse from 'babel-traverse';
import * as types from 'babel-types';
import { sortBy, isEqual } from 'lodash';
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
  variableDeclarator: Object;
  selections: Array<Position>;
  cursorPositions: Array<Position> = [];

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

  addDeclarationToScope(scope: Object, path: Object) {
    if (types.isMemberExpression(path)) {
      const { node } = path;
      this.variableIdentifier = scope.generateUidIdentifierBasedOnNode(node.id);
      scope.push({ id: this.variableIdentifier, init: node, kind: this.variableType });
      const variableDeclarator = types.variableDeclarator(
        types.objectPattern([
          types.objectProperty(types.clone(node.property), types.clone(node.property), false, true),
        ]),
        node.object,
      );

      scope.bindings[this.variableIdentifier.name].path.replaceWith(variableDeclarator);
      this.variableDeclarator = variableDeclarator;
      this.variableIdentifier = node.property;
    } else {
      const { node } = path;
      this.variableIdentifier = scope.generateUidIdentifierBasedOnNode(node.id);
      scope.push({ id: this.variableIdentifier, init: node, kind: this.variableType });
    }
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
    const getPathScope = path =>
      (types.isArrowFunctionExpression(path) ? path.scope.parent : path.scope);

    const firstSelection = this.selections[0];

    programPath.traverse({
      Expression: (path) => {
        const { node } = path;
        if (!node.visited && firstSelection.includes(Position.fromNode(node))) {
          const scope = getPathScope(path);
          node.visited = true;
          this.addDeclarationToScope(scope, path);
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
            (isEqual(this.findScopeRoad(declaratorPath.scope), this.scopeRoad) &&
              declaratorPath.node.id.name === this.variableIdentifier.name) ||
            (types.isObjectPattern(declaratorPath.node.id) &&
              declaratorPath.node.id.properties
                .map(property => property.value.name)
                .includes(this.variableIdentifier.name))
          ) {
            const { scope } = declaratorPath;
            const binding = scope.bindings[this.variableIdentifier.name];
            const declarationPath = declaratorPath.parentPath;
            let referencePaths = [];
            scope.path.traverse({
              AssignmentExpression: (assignmentPath) => {
                if (assignmentPath.node.left.name === this.variableIdentifier.name) {
                  assignmentPath.traverse({
                    Identifier: (identifierPath) => {
                      if (
                        identifierPath.key === 'left' &&
                        identifierPath.parentPath === assignmentPath
                      ) {
                        referencePaths.push(identifierPath);
                      }
                    },
                  });
                }
              },
            });
            referencePaths = referencePaths.concat(
              binding.referencePaths.filter(refPath => refPath.node !== binding.identifier),
            );
            referencePaths = sortBy(referencePaths, [path => path.node.start]);
            const firstReferencePath = referencePaths[0];
            const firstReferencePathParentStatement = firstReferencePath.find(
              path =>
                types.isStatement(path) &&
                types.isNodesEquivalent(path.scope.path.node, scope.path.node),
            );
            // eslint-disable-next-line
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

  mergeDeclarations = (programPath: Object) => {
    programPath.traverse({
      VariableDeclarator: (declaratorPath) => {
        if (
          isEqual(this.findScopeRoad(declaratorPath.scope), this.scopeRoad) &&
          (types.isObjectPattern(declaratorPath.node.id) &&
            declaratorPath.node.id.properties
              .map(property => property.value.name)
              .includes(this.variableIdentifier.name))
        ) {
          const { scope } = declaratorPath;
          const binding = scope.bindings[this.variableIdentifier.name];
          const bindingsWithSameInit = Object.values(scope.bindings).filter((nextBinding: any) =>
            types.isNodesEquivalent(binding.path.node.init, nextBinding.path.node.init),
          );
          const highestBinding = (bindingsWithSameInit[0]: any);
          const clonedProperty = types.clone(binding.path.node.id.properties[0]);
          if (binding !== highestBinding) {
            binding.path.remove();
            highestBinding.path.traverse({
              ObjectPattern: (opPath) => {
                opPath.pushContainer('properties', clonedProperty);
              },
            });
          }
        }
      },
    });
  };

  setCursorPosition = (programPath: Object) => {
    programPath.traverse({
      VariableDeclarator: (declaratorPath) => {
        if (
          isEqual(this.findScopeRoad(declaratorPath.scope), this.scopeRoad) &&
          declaratorPath.node.id.name === this.variableIdentifier.name
        ) {
          const { scope } = declaratorPath;
          const binding = scope.bindings[this.variableIdentifier.name];
          const referencePaths = binding.referencePaths.map(path => Position.fromNode(path.node));
          this.cursorPositions = [Position.fromNode(binding.path.node.id), ...referencePaths];
          programPath.stop();
        } else if (
          types.isObjectPattern(declaratorPath.node.id) &&
          declaratorPath.node.id.properties
            .map(property => property.value.name)
            .includes(this.variableIdentifier.name)
        ) {
          const { scope } = declaratorPath;
          const binding = scope.bindings[this.variableIdentifier.name];
          let referencePaths = [];
          scope.path.traverse({
            AssignmentExpression: (assignmentPath) => {
              if (assignmentPath.node.left.name === this.variableIdentifier.name) {
                assignmentPath.traverse({
                  Identifier: (identifierPath) => {
                    if (
                      identifierPath.key === 'left' &&
                      identifierPath.parentPath === assignmentPath
                    ) {
                      referencePaths.push(identifierPath);
                    }
                  },
                });
              }
            },
          });
          referencePaths = referencePaths.concat(binding.referencePaths);
          referencePaths = sortBy(referencePaths, [path => path.node.start]);
          const referencePositions = referencePaths.map(path => Position.fromNode(path.node));
          this.cursorPositions = [...referencePositions];
        }
      },
    });
  };

  start(): { ast: Object, result: { code: string, cursorPositions: Array<Position> } } {
    this.transform(this.extractVariable);
    this.transform(this.moveDeclaration);
    this.transform(this.mergeDeclarations);
    this.transform(this.setCursorPosition, { recast: false });

    return { ast: this.ast, result: { code: this.code, cursorPositions: this.cursorPositions } };
  }

  transform(transformation: Function, transformOptions: { recast: boolean } = { recast: true }) {
    traverse(this.ast, {
      Program(programPath) {
        transformation(programPath);
      },
    });
    if (transformOptions.recast) {
      this.code = recast.print(this.ast).code;
      this.ast = recast.parse(this.code, options);
    }
  }
}

// @flow
import { sortBy } from 'lodash';

export const referencePathsForVariableInScope = (scope: Object, variableName: string) => {
  const binding = scope.getOwnBinding(variableName);
  let referencePaths = [];
  scope.path.traverse({
    AssignmentExpression: (assignmentPath) => {
      if (assignmentPath.node.left.name === variableName) {
        assignmentPath.traverse({
          Identifier: (identifierPath) => {
            if (identifierPath.key === 'left' && identifierPath.parentPath === assignmentPath) {
              referencePaths.push(identifierPath);
            }
          },
        });
      }
    },
  });
  let bindingPaths = binding.referencePaths;

  bindingPaths = bindingPaths.filter(refPath => refPath.node !== binding.identifier);
  referencePaths = referencePaths.concat(bindingPaths);
  return sortBy(referencePaths, [path => path.node.start]);
};

export const findScopeRoad = (scope: Object) => {
  const scopeRoad = [];
  scope.path.find((path) => {
    scopeRoad.push(path.key);
    return path.isProgram();
  });
  return scopeRoad;
};

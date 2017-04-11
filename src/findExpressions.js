// @flow
import { Parser } from 'cst';
import { flatten, compact } from 'lodash';
import type { selection, expression } from './types';
import { normalizeSelection, denormalizeSelection } from './helpers';

function parse(code: string): Object {
  return new Parser().parse(code);
}

function findAllExpressions(ast: Object) {
  const nodesIndex = ast._traverse._nodeIndex._index;
  return flatten(
    Object.keys(nodesIndex).map(nodeType => nodesIndex[nodeType].filter(node => node.isExpression)),
  );
}

export function findSelectedExpression(ast: Object, selection: selection): ?Object {
  const allExpressions = findAllExpressions(ast);

  function isSearchedExpression(expression) {
    const expressionPosition = expression.getLoc();
    return expressionPosition.start.column === selection.start.column &&
      expressionPosition.start.line === selection.start.line &&
      expressionPosition.end.column === selection.end.column &&
      expressionPosition.end.line === selection.end.line;
  }

  return allExpressions.find(isSearchedExpression);
}

function findExpressionsAt(ast: Object, selection: selection) {
  const allExpressions = findAllExpressions(ast);

  function isOneLineExpression(expression) {
    const expressionPosition = expression.getLoc();
    return expressionPosition.start.line === expressionPosition.end.line;
  }

  function isOneLineExpressionInRange(expression) {
    const expressionPosition = expression.getLoc();
    return expressionPosition.start.column <= selection.start.column &&
      expressionPosition.start.line === selection.start.line &&
      expressionPosition.end.column >= selection.end.column &&
      expressionPosition.end.line === selection.end.line;
  }

  function isMultiLineExpressionInRange(expression) {
    const expressionPosition = expression.getLoc();
    return expressionPosition.start.line <= selection.start.line &&
      expressionPosition.end.line >= selection.end.line;
  }

  return allExpressions
    .filter((expression) => {
      if (isOneLineExpression(expression)) {
        return isOneLineExpressionInRange(expression);
      }
      return isMultiLineExpressionInRange(expression);
    })
    .sort((previousExpression, nextExpression) => {
      const previousRange = previousExpression.getRange();
      const nextRange = nextExpression.getRange();
      return previousRange[1] - previousRange[0] - (nextRange[1] - nextRange[0]);
    });
}

const defaultOptions = {
  depth: 0,
  exact: false,
};

type findExpressionsOptions = {
  depth: number,
  exact: boolean,
};

function formatExpression(expression) {
  return {
    value: expression.getSourceCode(),
    selection: denormalizeSelection(expression.getLoc()),
  };
}

export function findExpressions(
  code: string,
  selection: selection,
  options: findExpressionsOptions = defaultOptions,
): Array<expression> {
  const ast = parse(code);
  const normalizedSelection = normalizeSelection(selection);
  let expressions;
  if (options.exact) {
    expressions = compact([findSelectedExpression(ast, normalizedSelection)]);
  } else {
    expressions = findExpressionsAt(ast, normalizedSelection);
  }
  if (expressions.length === 0) {
    throw new ExpressionNotFoundError();
  } else {
    return expressions.slice(0, options.depth || expressions.length + 1).map(formatExpression);
  }
}

export class ExpressionNotFoundError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ExpressionNotFoundError';
  }
}

// @flow
import chunk from 'lodash/chunk';
import { AstExplorer, Position } from '../lib/main';

function createMessageFromError({ name, message }) {
  const status = 'error';
  switch (name) {
    case 'ExpressionNotFound': {
      return { status, error: { name, message } };
    }
    case 'IdentifierNotFound': {
      return { status, error: { name, message } };
    }
    case 'SyntaxError': {
      return { status, error: { name, message: 'Unable to parse the code' } };
    }
    default: {
      return { status, error: { name, message } };
    }
  }
}

module.exports = {
  'get-expressions': (file: string, args: Array<string>) => {
    try {
      const selection = new Position(parseInt(args[0], 10), parseInt(args[1], 10));
      const astExplorer = new AstExplorer(file);
      const expressions = astExplorer.findExpressions(selection);
      return { status: 'ok', expressions };
    } catch (e) {
      return createMessageFromError(e);
    }
  },
  'extract-variable': (file: string, args: Array<string>) => {
    try {
      const intPositions = args.map(position => parseInt(position, 10));
      const positionPairs = chunk(intPositions, 2);
      const selections = positionPairs.map(([start, end]) => new Position(start, end));
      const astExplorer = new AstExplorer(file);
      const result = astExplorer.extractVariable(selections, { type: 'let' });
      return { status: 'ok', ...result };
    } catch (e) {
      return createMessageFromError(e);
    }
  },
  'extract-constant': (file: string, args: Array<string>) => {
    try {
      const intPositions = args.map(position => parseInt(position, 10));
      const positionPairs = chunk(intPositions, 2);
      const selections = positionPairs.map(([start, end]) => new Position(start, end));
      const astExplorer = new AstExplorer(file);
      const result = astExplorer.extractVariable(selections, { type: 'const' });
      return { status: 'ok', ...result };
    } catch (e) {
      return createMessageFromError(e);
    }
  },
  'rename-identifier': (file: string, args: Array<string>) => {
    try {
      const selection = new Position(parseInt(args[0], 10), parseInt(args[1], 10));
      const newName = args[2];
      const astExplorer = new AstExplorer(file);
      const result = astExplorer.renameIdentifier(selection, newName);
      return { status: 'ok', ...result };
    } catch (e) {
      return createMessageFromError(e);
    }
  },
  'get-expression-occurrences': (file: string, args: Array<string>) => {
    try {
      const selection = new Position(parseInt(args[0], 10), parseInt(args[1], 10));
      const astExplorer = new AstExplorer(file);
      const expressions = astExplorer.findExpressionOccurrences(selection);
      return { status: 'ok', expressions };
    } catch (e) {
      return createMessageFromError(e);
    }
  },
};

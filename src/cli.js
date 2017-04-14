#! /usr/bin/env node
// @flow
import 'babel-polyfill';
import program from 'commander';
import getStdin from 'get-stdin';
import chunk from 'lodash/chunk';
import { AstExplorer, Position } from '../lib/main';

(() => {
  function writeJSON(message) {
    process.stdout.write(JSON.stringify(message));
  }

  function createMessageFromError({ name, message }) {
    const status = 'error';
    switch (name) {
      case 'ExpressionNotFound': {
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

  async function extractVariableCmd(selections) {
    const file = await getStdin();
    try {
      const astExplorer = new AstExplorer(file);
      let result;
      if (selections.length === 1) {
        result = astExplorer.extractVariable(selections[0]);
      } else {
        result = astExplorer.extractMultipleVariables(selections);
      }
      writeJSON({ status: 'ok', ...result });
    } catch (error) {
      writeJSON(createMessageFromError(error));
    }
  }

  async function getExpressionsCmd(selection) {
    const file = await getStdin();
    try {
      const astExplorer = new AstExplorer(file);
      const expressions = astExplorer.findExpressions(selection);
      writeJSON({ status: 'ok', expressions });
    } catch (error) {
      writeJSON(createMessageFromError(error));
    }
  }

  async function getExpressionOccurrencesCmd(selection) {
    const file = await getStdin();
    try {
      const astExplorer = new AstExplorer(file);
      const expressions = astExplorer.findExpressionOccurrences(selection);
      writeJSON({ status: 'ok', expressions });
    } catch (error) {
      writeJSON(createMessageFromError(error));
    }
  }

  program
    .command('get-expressions <startPosition> <endPosition>')
    .description('get expressions at range')
    .action((startPosition, endPosition) => {
      const selection = new Position(parseInt(startPosition, 10), parseInt(endPosition, 10));
      getExpressionsCmd(selection);
    });

  program
    .command('extract-variable [positions...]')
    .description('extract variable at range')
    .action((positions) => {
      const intPositions = positions.map(position => parseInt(position, 10));
      const positionPairs = chunk(intPositions, 2);
      const selections = positionPairs.map(([start, end]) => new Position(start, end));
      extractVariableCmd(selections);
    });

  program
    .command('get-expression-occurrences <startPosition> <endPosition>')
    .description('get all expressions of the same value at the same scope')
    .action((startPosition, endPosition) => {
      const selection = new Position(parseInt(startPosition, 10), parseInt(endPosition, 10));
      getExpressionOccurrencesCmd(selection);
    });

  program.version('0.0.1').parse(process.argv);
})();

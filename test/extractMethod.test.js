// @flow

import Position from '../src/Position';
import testAllAssumptions from './helpers/testAllAssumptions';
import AstExplorer from '../src/AstExplorer';

testAllAssumptions('extractMethod', ({ code, selections }) => {
  const astExplorer = new AstExplorer(code);
  const result = astExplorer.extractMethod(
    selections.map(({ start, end }) => new Position(start, end)),
  );
  return {
    code: result.code,
    selections: result.cursorPositions.map(({ start, end }) => ({
      start,
      end,
    })),
  };
});

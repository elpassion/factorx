// @flow

import { sortBy } from 'lodash';
import fs from 'fs';
import glob from 'glob';

const parseCode = (code: string) => {
  const findStartMarker = (codeString: string) => codeString.indexOf('/* CS */');
  const findEndMarker = (codeString: string) => codeString.indexOf('/* CE */');
  const removeStartMarker = (codeString: string) =>
    codeString
      .slice(0, findStartMarker(codeString))
      .concat(codeString.slice(findStartMarker(codeString) + 8));
  const removeEndMarker = (codeString: string) =>
    codeString
      .slice(0, findEndMarker(codeString))
      .concat(codeString.slice(findEndMarker(codeString) + 8));

  const findCursors = (codeString: string) => {
    let newCode = codeString.slice(0);
    newCode = newCode.replace(/\/\* C \*\//g, '/* CS *//* CE */');
    const selections = [];
    while (newCode.includes('/* CS */') || newCode.includes('/* CE */')) {
      const start = findStartMarker(newCode);
      newCode = removeStartMarker(newCode);
      const end = findEndMarker(newCode);
      newCode = removeEndMarker(newCode);
      selections.push({ start, end });
    }
    return {
      code: newCode,
      selections,
    };
  };

  return findCursors(code);
};

const buildCode = ({
  code,
  selections,
}: {
  code: string,
  selections: Array<{ start: number, end: number }>,
}): string => {
  let newCode = code.slice(0);
  const sortedSelections = sortBy(selections, [selection => -selection.end]);
  sortedSelections.forEach((selection) => {
    newCode = newCode
      .slice(0, selection.end)
      .concat('/* CE */')
      .concat(newCode.slice(selection.end));
    newCode = newCode
      .slice(0, selection.start)
      .concat('/* CS */')
      .concat(newCode.slice(selection.start));
  });
  return newCode;
};

const parseInOut = (inOut: string) => {
  const [markedInput, output] = inOut.split('// output\n');
  const input = markedInput.split('// input\n')[1];
  return { input, output };
};

const parseFile = (path: string) => {
  const file = fs.readFileSync(path);
  const { input, output } = parseInOut(file.toString());
  return { input: parseCode(input.trim()), output: parseCode(output.trim()) };
};

const testAssumption = (path: string, transformation: Function) => {
  const { input, output } = parseFile(path);
  test(`Assumptions in ${path} are correct`, () => {
    expect(transformation(input)).toEqual(output);
  });
};

const testAllAssumptions = (folderName: string, transformation: Function) => {
  const files = glob.sync(`test/${folderName}/*.compare.js`);
  files.forEach(file => testAssumption(file, transformation));
};

export default testAllAssumptions;

describe('#parseCode', () => {
  test('correctly parses code with one cursor', () => {
    expect(parseCode('5 + /* CS *//* CE */5;')).toEqual({
      code: '5 + 5;',
      selections: [{ start: 4, end: 4 }],
    });
  });
  test('correctly parses code with multiple cursors', () => {
    expect(parseCode('/* CS */5/* CE */ + /* CS */5/* CE */;')).toEqual({
      code: '5 + 5;',
      selections: [{ start: 0, end: 1 }, { start: 4, end: 5 }],
    });
  });
  test('correctly parses empty cursor marker', () => {
    expect(parseCode('/* C */5 + /* C */5;')).toEqual({
      code: '5 + 5;',
      selections: [{ start: 0, end: 0 }, { start: 4, end: 4 }],
    });
  });
});

describe('#buildCode', () => {
  test('correctly builds code with one cursor', () => {
    expect(buildCode({ code: '5 + 5;', selections: [{ start: 4, end: 4 }] })).toEqual(
      '5 + /* CS *//* CE */5;',
    );
  });
  test('correctly builds code with multiple cursors', () => {
    expect(
      buildCode({ code: '5 + 5;', selections: [{ start: 0, end: 1 }, { start: 4, end: 5 }] }),
    ).toEqual('/* CS */5/* CE */ + /* CS */5/* CE */;');
  });
});

describe('#parseInOut', () => {
  test('correctly parses in and out code', () => {
    expect(parseInOut('// input\n5 + 5;\n// output\n5 + 5;\n')).toEqual({
      input: '5 + 5;\n',
      output: '5 + 5;\n',
    });
  });
});

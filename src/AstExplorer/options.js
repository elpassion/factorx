// @flow
import * as babylon from 'babylon';

const options = {
  parser: {
    parse(source: string) {
      return babylon.parse(source, {
        sourceType: 'module',
        plugins: [
          'asyncGenerators',
          'classConstructorCall',
          'classProperties',
          'decorators',
          'doExpressions',
          'exportExtensions',
          'flow',
          'functionSent',
          'functionBind',
          'jsx',
          'objectRestSpread',
          'dynamicImport',
        ],
      });
    },
  },
};

export default options;

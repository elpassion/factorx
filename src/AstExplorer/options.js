import recast from 'recast';

const options = {
  parserOpts: {
    parser: recast.parse,
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
  },
  generatorOpts: {
    generator: recast.print,
  },
};

export default options;

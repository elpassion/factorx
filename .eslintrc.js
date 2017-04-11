module.exports = {
  parser: 'babel-eslint',
  extends: 'airbnb-base',
  plugins: ['import', 'promise', 'flowtype'],
  env: {
    node: true,
    jest: true,
  },
};

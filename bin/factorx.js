#! /usr/bin/env node
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

require('babel-polyfill');

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _getStdin = require('get-stdin');

var _getStdin2 = _interopRequireDefault(_getStdin);

var _chunk = require('lodash/chunk');

var _chunk2 = _interopRequireDefault(_chunk);

var _main = require('../lib/main');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

(function () {
  var extractVariableCmd = function () {
    var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(selections, variableOptions) {
      var file, astExplorer, result;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return (0, _getStdin2.default)();

            case 2:
              file = _context.sent;

              try {
                astExplorer = new _main.AstExplorer(file);
                result = void 0;

                if (selections.length === 1) {
                  result = astExplorer.extractVariable(selections[0], variableOptions);
                } else {
                  result = astExplorer.extractMultipleVariables(selections, variableOptions);
                }
                writeJSON(_extends({ status: 'ok' }, result));
              } catch (error) {
                writeJSON(createMessageFromError(error));
              }

            case 4:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function extractVariableCmd(_x, _x2) {
      return _ref2.apply(this, arguments);
    };
  }();

  var getExpressionsCmd = function () {
    var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(selection) {
      var file, astExplorer, expressions;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return (0, _getStdin2.default)();

            case 2:
              file = _context2.sent;

              try {
                astExplorer = new _main.AstExplorer(file);
                expressions = astExplorer.findExpressions(selection);

                writeJSON({ status: 'ok', expressions: expressions });
              } catch (error) {
                writeJSON(createMessageFromError(error));
              }

            case 4:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    return function getExpressionsCmd(_x3) {
      return _ref3.apply(this, arguments);
    };
  }();

  var getExpressionOccurrencesCmd = function () {
    var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(selection) {
      var file, astExplorer, expressions;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return (0, _getStdin2.default)();

            case 2:
              file = _context3.sent;

              try {
                astExplorer = new _main.AstExplorer(file);
                expressions = astExplorer.findExpressionOccurrences(selection);

                writeJSON({ status: 'ok', expressions: expressions });
              } catch (error) {
                writeJSON(createMessageFromError(error));
              }

            case 4:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    return function getExpressionOccurrencesCmd(_x4) {
      return _ref4.apply(this, arguments);
    };
  }();

  function writeJSON(message) {
    process.stdout.write(JSON.stringify(message));
  }

  function createMessageFromError(_ref) {
    var name = _ref.name,
        message = _ref.message;

    var status = 'error';
    switch (name) {
      case 'ExpressionNotFound':
        {
          return { status: status, error: { name: name, message: message } };
        }
      case 'SyntaxError':
        {
          return { status: status, error: { name: name, message: 'Unable to parse the code' } };
        }
      default:
        {
          return { status: status, error: { name: name, message: message } };
        }
    }
  }

  _commander2.default.command('get-expressions <startPosition> <endPosition>').description('get expressions at range').action(function (startPosition, endPosition) {
    var selection = new _main.Position(parseInt(startPosition, 10), parseInt(endPosition, 10));
    getExpressionsCmd(selection);
  });

  _commander2.default.command('extract-variable [positions...]').description('extract variable at range').action(function (positions) {
    var intPositions = positions.map(function (position) {
      return parseInt(position, 10);
    });
    var positionPairs = (0, _chunk2.default)(intPositions, 2);
    var selections = positionPairs.map(function (_ref5) {
      var _ref6 = _slicedToArray(_ref5, 2),
          start = _ref6[0],
          end = _ref6[1];

      return new _main.Position(start, end);
    });
    extractVariableCmd(selections, { type: 'let' });
  });

  _commander2.default.command('extract-constant [positions...]').description('extract constant at range').action(function (positions) {
    var intPositions = positions.map(function (position) {
      return parseInt(position, 10);
    });
    var positionPairs = (0, _chunk2.default)(intPositions, 2);
    var selections = positionPairs.map(function (_ref7) {
      var _ref8 = _slicedToArray(_ref7, 2),
          start = _ref8[0],
          end = _ref8[1];

      return new _main.Position(start, end);
    });
    extractVariableCmd(selections, { type: 'const' });
  });

  _commander2.default.command('get-expression-occurrences <startPosition> <endPosition>').description('get all expressions of the same value at the same scope').action(function (startPosition, endPosition) {
    var selection = new _main.Position(parseInt(startPosition, 10), parseInt(endPosition, 10));
    getExpressionOccurrencesCmd(selection);
  });

  _commander2.default.version('0.0.1').parse(process.argv);
})();
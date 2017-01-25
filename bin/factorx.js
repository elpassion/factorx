#! /usr/bin/env node
'use strict';

require('babel-polyfill');

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _getStdin = require('get-stdin');

var _getStdin2 = _interopRequireDefault(_getStdin);

var _main = require('../lib/main');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

(function () {
  var getExpressionsCmd = function () {
    var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(selection, options) {
      var file, expressions;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return (0, _getStdin2.default)();

            case 2:
              file = _context.sent;

              try {
                expressions = (0, _main.findExpressions)(file, selection, options);

                writeJSON({ status: 'ok', expressions: expressions });
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

    return function getExpressionsCmd(_x, _x2) {
      return _ref2.apply(this, arguments);
    };
  }();

  var extractVariableCmd = function () {
    var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(selection) {
      var file, code;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return (0, _getStdin2.default)();

            case 2:
              file = _context2.sent;

              try {
                code = (0, _main.extractVariable)(file, selection);

                writeJSON({ status: 'ok', code: code });
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

    return function extractVariableCmd(_x3) {
      return _ref3.apply(this, arguments);
    };
  }();

  _commander2.default.command('get-expressions <startLine> <startColumn> <endLine> <endColumn>').option('-d, --depth [depth]', 'set the depth the expressions should be looked for').option('-e, --exact [exact]', 'should it search for expressions in exact passed selection').description('get expressions at range').action(function (startLine, startColumn, endLine, endColumn, _ref) {
    var depth = _ref.depth,
        exact = _ref.exact;

    var options = {
      depth: depth ? parseInt(depth) : 0,
      exact: exact === 'true'
    };
    var selection = createSelection(startLine, startColumn, endLine, endColumn);
    getExpressionsCmd(selection, options);
  });

  _commander2.default.command('extract-variable <startLine> <startColumn> <endLine> <endColumn>').description('extract variable at range').action(function (startLine, startColumn, endLine, endColumn) {
    var selection = createSelection(startLine, startColumn, endLine, endColumn);
    extractVariableCmd(selection);
  });

  _commander2.default.version('0.0.1').parse(process.argv);

  function createSelection(startLine, startColumn, endLine, endColumn) {
    return {
      start: { line: parseInt(startLine), column: parseInt(startColumn) },
      end: { line: parseInt(endLine), column: parseInt(endColumn) }
    };
  }

  function createMessageFromError(_ref4) {
    var name = _ref4.name,
        message = _ref4.message;

    var status = 'error';
    switch (name) {
      case 'ExpressionNotFound':
        {
          return { status: status, error: { name: name, message: message } };
        }case 'SyntaxError':
        {
          return { status: status, error: { name: name, message: 'Unable to parse the code' } };
        }default:
        {
          return { status: status, error: { name: name, message: message } };
        }
    }
  }

  function writeJSON(message) {
    process.stdout.write(JSON.stringify(message));
  }
})();
"use strict";

exports.__esModule = true;
exports.default = void 0;

var _pumpify = _interopRequireDefault(require("pumpify"));

var _merge = _interopRequireDefault(require("merge2"));

var _duplexify = _interopRequireDefault(require("duplexify"));

var _through = _interopRequireDefault(require("through2"));

var _unzipper = _interopRequireDefault(require("unzipper"));

var _endOfStream = _interopRequireDefault(require("end-of-stream"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = (parser, regex) => {
  const out = (0, _merge.default)({
    end: false
  });

  const dataStream = _pumpify.default.obj(_unzipper.default.Parse(), _through.default.obj((entry, _, cb) => {
    if (entry.type !== 'File' || !regex.test(entry.path)) {
      entry.autodrain();
      return cb();
    }

    const file = _pumpify.default.obj(entry, parser());

    out.add(file);
    (0, _endOfStream.default)(file, cb);
  }));

  (0, _endOfStream.default)(dataStream, () => out.push(null));
  return _duplexify.default.obj(dataStream, out);
};

exports.default = _default;
module.exports = exports.default;
// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { parseCommand, splitCommand, parseArguments, splitArguments } = require('./lib')
const { addSlashes, removeSlashes } = require('./lib/escape/slashes')
const { escapeArgument } = require('./lib/escape')
const { parseArgument } = require('./lib/metadata/arguments')
const { splitArgumentBlocks } = require('./lib/split')
const { EscapeError, ParseError } = require('./lib/error')

module.exports = {
  parseCommand,
  splitCommand,
  parseArguments,
  splitArguments,
  exception: {
    EscapeError,
    ParseError
  },
  util: {
    splitArgumentBlocks,
    parseArgument,
    escapeArgument,
    addSlashes,
    removeSlashes
  }
}

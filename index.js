// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { parseNestedQuotes } = require('./lib/split')
const { reduceQuoteDepth, splitNestedQuotes, flattenNestedQuotes, combineEscapedSpaces } = require('./lib/split/quotes')
const { unpackCombinedOptionsList } = require('./lib/arguments/meta')
const { parseCommand, splitCommand, parseArguments, splitArguments } = require('./lib')

module.exports = {
  parseCommand,
  splitCommand,
  parseArguments,
  splitArguments,
  util: {
    reduceQuoteDepth,
    combineEscapedSpaces,
    flattenNestedQuotes,
    parseNestedQuotes,
    splitNestedQuotes,
    unpackCombinedOptionsList
  }
}

// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { parseNestedQuotes } = require('./lib/split')
const { reduceQuoteDepth, splitNestedQuotes, flattenNestedQuotes } = require('./lib/split/quotes')
const { unpackCombinedOptionsList } = require('./lib/arguments/meta')
const { parseCommand, splitCommand } = require('./lib')

module.exports = {
  parseCommand,
  splitCommand,
  util: {
    reduceQuoteDepth,
    flattenNestedQuotes,
    parseNestedQuotes,
    splitNestedQuotes,
    unpackCombinedOptionsList
  }
}

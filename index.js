// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { argumentMetadataStandalone } = require('./lib/metadata/arguments')
const { escapeArgument } = require('./lib/escape')
const { addSlashes, removeSlashes } = require('./lib/escape/slashes')
const { parseCommand, splitCommand, parseArguments, splitArguments } = require('./lib')

module.exports = {
  parseCommand,
  splitCommand,
  parseArguments,
  splitArguments,
  util: {
    argumentMetadata: argumentMetadataStandalone,
    escapeArgument,
    addSlashes,
    removeSlashes
  }
}

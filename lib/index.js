// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { mergeDefaults } = require('./defaults')
const { makeArgumentMetadata, unpackCombinedOptions } = require('./arguments')
const { splitIntoArguments } = require('./split')
const { checkCommand } = require('./error')

/**
 * Splits up a command into chunks.
 */
const splitCommand = (command, userOptions, userFormat) => {
  checkCommand('parseCommand', command)
  const { options, format } = mergeDefaults(userOptions, userFormat)
  const args = splitIntoArguments(command, options, format)
  return unpackCombinedOptions(args, options, format)
}

/**
 * Splits up a command into segments with metadata.
 */
const parseCommand = (command, userOptions, userFormat) => {
  checkCommand('parseCommand', command)
  const { options, format } = mergeDefaults(userOptions, userFormat)
  const args = splitIntoArguments(command, options, format)
  const meta = makeArgumentMetadata(args, options, format)
  return {
    input: command,
    inputSplit: unpackCombinedOptions(args, options, format),
    arguments: meta.items,
    options: meta.options
  }
}

module.exports = {
  parseCommand,
  splitCommand
}

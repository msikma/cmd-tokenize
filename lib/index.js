// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { mergeDefaults } = require('./defaults')
const { makeArgumentMetadata, unpackCombinedOptions } = require('./arguments')
const { splitIntoArguments } = require('./split')
const { checkCommand } = require('./error')

/**
 * Does the initial work needed to properly parse a command.
 * 
 * The input is checked, split up and has its quotation marks normalized.
 * The user's options and format object are also combined with the defaults.
 */
const prepareCommand = (fn, command, userOptions, userFormat) => {
  checkCommand(fn, command)
  const { options, format } = mergeDefaults(userOptions, userFormat)
  const args = splitIntoArguments(command, options, format)
  const unpacked = unpackCombinedOptions(args, options, format)
  return { args, unpacked, options, format }
}

/**
 * Splits up a command into chunks.
 */
const splitCommand = (command, userOptions, userFormat) => {
  const { unpacked } = prepareCommand('splitCommand', command, userOptions, userFormat)
  return unpacked
}

/**
 * Splits up a command into segments with metadata.
 */
const parseCommand = (command, userOptions, userFormat) => {
  const { args, unpacked, options, format } = prepareCommand('parseCommand', command, userOptions, userFormat)
  const meta = makeArgumentMetadata(args, options, format)
  return {
    input: command,
    inputSplit: unpacked,
    arguments: meta.items,
    options: meta.options
  }
}

/**
 * Alias for parseCommand(), with 'firstIsExec' always false.
 */
const parseArguments = (argumentList, userOptions, userFormat) => {
  return parseCommand(argumentList, { ...userOptions, firstIsExec: false }, userFormat)
}

/**
 * Alias for splitCommand(), with 'firstIsExec' always false.
 */
const splitArguments = (argumentList, userOptions, userFormat) => {
  return splitCommand(argumentList, { ...userOptions, firstIsExec: false }, userFormat)
}

module.exports = {
  parseCommand,
  splitCommand,
  parseArguments,
  splitArguments
}

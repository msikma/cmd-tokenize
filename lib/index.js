// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { isString, isArray, reprObject } = require('./util')
const { ParseError } = require('./error')
const { getArgumentSegments } = require('./split')
const { mergeDefaults } = require('./defaults')
const { makeArgumentMetadata } = require('./metadata')

/**
 * Parses a command string according to a given set of rules.
 */
const commandParse = (callerName, doFullParsing, overrideOptions = {}) => (cmd, userOptions, userFormat) => {
  if (!isString(cmd) && !isArray(cmd)) {
    throw new ParseError(`${callerName}: Command must be a string or an array of strings: ${reprObject(cmd)}`)
  }

  const { options, format } = mergeDefaults({ ...userOptions, ...overrideOptions }, userFormat)
  const args = getArgumentSegments(cmd, options)

  // If only splitting, return the argument segments only.
  if (!doFullParsing) {
    return args
  }

  const meta = makeArgumentMetadata(args, options, format)

  return {
    command: cmd,
    commandSplit: args,
    arguments: meta,
    options: {
      ...options,
      format
    }
  }
}

/**
 * Parses a command string and returns an object with argument metdata.
 * 
 * Escape characters are unescaped, and the arguments are tagged with metadata
 * that describes what type they are, such as whether they are options or not.
 */
const parseCommand = commandParse('parseCommand', true)

/**
 * Splits a command string up into an array of argument segments.
 * 
 * Any escaped characters are unescaped. No additional parsing is performed;
 * arguments that would normally be split (e.g. '-abc' into '-a', '-b', '-c')
 * are kept as-is.
 */
const splitCommand = commandParse('splitCommand', false)

/** Parses arguments, with the added assumption that no executable name is present. */
const parseArguments = commandParse('parseArguments', true, { firstIsExec: false })

/** This is only here for consistency, as the output will always be the same regardless. */
const splitArguments = commandParse('splitArguments', false, { firstIsExec: false })

module.exports = {
  parseCommand,
  splitCommand,
  parseArguments,
  splitArguments
}

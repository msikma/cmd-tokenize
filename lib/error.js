// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { isString } = require('./util')

/**
 * Returns an error to throw when the user passes an invalid value.
 */
const interfaceError = message => (
  new class CmdParseInterfaceError extends Error {
    constructor(args) {
      super(args)
      this.code = 'CMD_PARSE_ARG_ERROR'
      this.message = message
    }
  }
)

/**
 * Checks whether a command is valid.
 */
const checkCommand = (caller, command) => {
  if (!isString(command)) {
    throw interfaceError(`${caller}: command must be a string`)
  }
}

module.exports = {
  interfaceError,
  checkCommand
}

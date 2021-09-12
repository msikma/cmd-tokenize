// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

/**
 * Returns an error to throw when the user passes an invalid value.
 */
const interfaceError = message => (
  new class CmdTokenizeInterfaceError extends Error {
    constructor(args) {
      super(args)
      this.code = 'CMD_TOKENIZE_ARG_ERROR'
      this.message = message
    }
  }
)

/**
 * Thrown when something goes wrong during parsing.
 */
const parsingError = (code, message) => (
  new class CmdTokenizeParseError extends Error {
    constructor(args) {
      super(args)
      this.code = `CMD_TOKENIZE_${code}`
      this.message = message
    }
  }
)

module.exports = {
  interfaceError,
  parsingError
}

// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

/**
 * Error class for problems with the input passed to parseCommand().
 */
class EscapeError extends Error {
  constructor(message, char = null, index = 0) {
    super()
    this.code = `CMD_TOKENIZE_ESCAPE_ERROR`
    this.message = message
    this.char = char
    this.index = index
  }
}

/**
 * Error class used for parsing problems.
 */
class ParseError extends Error {
  constructor(message, char = null, index = 0) {
    super()
    this.code = `CMD_TOKENIZE_PARSE_ERROR`
    this.message = message
    this.char = char
    this.index = index
  }
}

module.exports = {
  ParseError,
  EscapeError
}

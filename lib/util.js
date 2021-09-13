// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

/** Checks whether something is a string. */
const isString = obj => typeof obj === 'string' || obj instanceof String

/** Checks whether something is an array. */
const isArray = Array.isArray

/** Checks whether a string is pure whitespace. */
const isWhitespace = str => str.match(/^\s+$/) != null

/** Checks whether a character is a quote. */
const isQuoteChar = str => str === `"` || str === `'`

/** Checks whether a character is an escape slash. */
const isEscapeChar = str => str === `\\`

/** Prints a simple representation of an object for debugging purposes. */
const reprObject = obj => obj === undefined ? 'undefined' : JSON.stringify([obj]).slice(1, -1)

module.exports = {
  isArray,
  isString,
  isWhitespace,
  isQuoteChar,
  isEscapeChar,
  reprObject
}

// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

/** Checks whether something is a string. */
const isString = obj => typeof obj === 'string' || obj instanceof String

/** Checks whether something is an array. */
const isArray = Array.isArray

module.exports = {
  isArray,
  isString
}

// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { isString } = require('../util')
const { addSlashes } = require('./slashes')

/**
 * Base class used for escape errors.
 */
class EscapeError extends Error {
  constructor(message) {
    super()
    this.message = message
  }
}

/**
 * Takes a string and escapes it for use as a terminal command argument.
 * 
 * This will wrap the content inside quotation marks (unless the input does not have either
 * whitespace or quotes) and escape it.
 * 
 * Importantly, trailing slash characters are moved to the outside of the quotes, to prevent
 * them from escaping the rightmost outer quote character we add.
 * 
 * This function has been tested with fuzzing, but it should not be relied on as a fool-proof
 * way to run commands that contain untrusted input.
 */
const escapeArgument = (input) => {
  if (!isString(input)) {
    throw new EscapeError('Input must be a string')
  }

  if (input === '') {
    return ''
  }

  let primary = input
  let remainder = ''

  const hasWhitespace = !!input.match(/\s/)?.[0]
  const hasSingleQuote = input.includes(`'`)
  const hasDoubleQuote = input.includes(`"`)
  const hasTrailingSlashes = input.match(/\\+$/)
  
  // Prevent trailing slashes from escaping the quotes by making sure they appear outside the quotes.
  if (hasTrailingSlashes) {
    primary = input.slice(0, hasTrailingSlashes.index)
    remainder = input.slice(hasTrailingSlashes.index)
  }

  // If the input has no whitespace or quotes, it does not need to be wrapped in quotes.
  if (!hasWhitespace && !hasSingleQuote && !hasDoubleQuote) {
    return `${addSlashes(primary)}${addSlashes(remainder)}`
  }

  // If there are no single quotes, wrap the input in double quotes; and vice versa.
  if (!hasSingleQuote) {
    return `'${addSlashes(primary)}'${addSlashes(remainder)}`
  }
  if (!hasDoubleQuote) {
    return `"${addSlashes(primary)}"${addSlashes(remainder)}`
  }

  // If both single and double quotes are present we need to increase the amount of slashes,
  // but only for either the single or the double quotes; we use double, although either works.
  return `"${addSlashes(primary, `"`)}"${addSlashes(remainder)}`
}

module.exports = {
  escapeArgument
}

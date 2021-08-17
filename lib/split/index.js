// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { splitNestedQuotes, handleSeparators, reduceQuoteDepth, removeWhitespace, mergeConsecutiveArguments, removeEmptyStrings, flattenNestedQuotes } = require('./quotes')

/**
 * Splits up a command into argument pieces that can be processed one by one.
 * 
 * Arguments are split by whitespace with quoted segments maintained. Nested quotes are
 * handled recursively and maintain their internal whitespace, while the nesting is lowered
 * by one level (to account for the fact quoted strings are already unwrapped).
 */
const splitIntoArguments = (str, options, format) => {
  let parsed = splitNestedQuotes(str, options.throwOnUnbalancedQuote)
  parsed = reduceQuoteDepth(parsed, options.preserveQuotes ? 0 : 1, null)
  parsed = flattenNestedQuotes(parsed)
  parsed = mergeConsecutiveArguments(parsed, options, format)
  parsed = handleSeparators(parsed, options, format)
  parsed = removeWhitespace(parsed)
  return parsed
}

/**
 * Transforms a string with nested quotes into an array structure, and removes the quotation marks.
 * 
 * For example, with a string like this:
 * 
 *     abc "def ghi \"jkl mno\"" pqr
 * 
 * the resulting structure will be:
 * 
 *     ['abc', ['def', 'ghi', ['jkl', 'mno']], 'pqr]
 * 
 * The depth of the array represents the depth of the nesting.
 */
const parseNestedQuotes = (str, keepWhitespace = false) => {
  let parsed = splitNestedQuotes(str)
  parsed = reduceQuoteDepth(parsed, Infinity, null)
  parsed = removeEmptyStrings(parsed, keepWhitespace)
  return parsed
}

module.exports = {
  splitIntoArguments,
  parseNestedQuotes
}

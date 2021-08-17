// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

/** The default parsing options. */
const defaultOptions = {
  // Transforms combined options into individual options (e.g. -asdf into -a -s -d -f).
  unpackCombinedOptions: true,
  // Preserves the quotes, instead of removing one layer of depth from them.
  preserveQuotes: false,
  // Whether to use or ignore the terminator option.
  useOptionsTerminator: true,
  // Whether to throw an error if unbalanced (unterminated) quotes are found.
  // If this is false and an unbalanced quote is found, the superfluous quotes are preserved verbatim.
  throwOnUnbalancedQuote: true
}

/** The format used to unpack argument metadata. */
const defaultFormat = {
  valuePrefix: [
    { type: 'unix', re: /^(-+)(.*)$/, isCombinable: true },
    { type: 'windows', re: /^(\/+)(.*)$/, isCombinable: true }
  ],
  // If an argument ends with a value suffix, it takes at least one value.
  valueSuffix: ['=', ':'],
  // This argument, when encountered, terminates all options;
  // everything from that point is a regular argument even if it contains a prefix.
  optionsTerminator: '--'
}

/**
 * Takes the user's options and format and returns them with the defaults merged in.
 */
const mergeDefaults = (userOptions = {}, userFormat = {}) => {
  return {
    options: { ...defaultOptions, ...userOptions },
    format: { ...defaultFormat, ...userFormat }
  }
}

module.exports = {
  defaultOptions,
  defaultFormat,
  mergeDefaults
}

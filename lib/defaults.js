// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

/** The default parsing options. */
const defaultOptions = {
  // Whether to scan for Windows style slash delimiters.
  useWindowsDelimiters: false,
  // Ensures that the first item is treated like the executable path.
  firstIsExec: true,
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
  // If an argument ends with a value suffix, it takes at least one value.
  valueSuffix: ['=', ':'],
  // This argument, when encountered, terminates all options;
  // everything from that point is a regular argument even if it contains a prefix.
  // Used on Unix systems only.
  optionsTerminator: '--'
}

/** Delimiters used to separate values. */
const valueDelimiters = {
  unix: [{ re: /^(-+)(.*)$/, isCombinable: true }],
  windows: [{ re: /^(\/+)(.*)$/, isCombinable: true }]
}

/**
 * Takes the user's options and format and returns them with the defaults merged in.
 */
const mergeDefaults = (userOptions = {}, userFormat = {}) => {
  const options = { ...defaultOptions, ...userOptions }
  const format = { ...defaultFormat, ...userFormat }

  // Pick a set of value delimiters based on the platform.
  const platform = options.useWindowsDelimiters ? 'windows' : 'unix'
  format.valuePrefix = valueDelimiters[platform].map(delimiter => ({ ...delimiter, type: platform }))
  
  return {
    options,
    format
  }
}

module.exports = {
  defaultOptions,
  defaultFormat,
  mergeDefaults
}

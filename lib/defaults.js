// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

/** The default parsing options. */
const defaultOptions = {
  // Whether to skip splitting up separator characters (not documented, internal use only).
  skipSeparatorSplitting: false,
  // Whether to scan for Windows style slash delimiters.
  useWindowsDelimiters: false,
  // Ensures that the first item is treated like the executable path.
  firstIsExec: true,
  // Transforms combined options into individual options (e.g. -asdf into -a -s -d -f).
  unpackCombinedOptions: true,
  // Preserves the quotes, instead of removing one layer of depth from them.
  preserveQuotes: false,
  // Whether to use or ignore the terminator option.
  useOptionsTerminator: true
}

/** The format used to unpack argument metadata. */
const defaultFormat = {
  // If an argument contains a value delimiter, it takes a value.
  valueSuffix: [{ char: '=' }, { char: ':' }],
  // This argument, when encountered, terminates all options;
  // everything from that point is a regular argument even if it contains a prefix.
  // Used on Unix systems only.
  optionsTerminator: '--'
}

/** Delimiters used to separate values. */
const valueDelimiters = {
  unix: [{ char: '-', isRepeatable: true }],
  windows: [{ char: '/', isRepeatable: false }]
}

/**
 * Takes the user's options and format and returns them with the defaults merged in.
 */
const mergeDefaults = (userOptions = {}, userFormat = {}) => {
  const options = { ...defaultOptions, ...userOptions }
  const format = { ...defaultFormat, ...userFormat }

  // Pick a set of value delimiters based on the platform.
  const platform = options.useWindowsDelimiters ? 'windows' : 'unix'
  format.valuePrefix = valueDelimiters[platform].map(delimiter => ({ ...delimiter, type: platform, re: new RegExp(`^(${delimiter.char}${delimiter.isRepeatable ? '+' : ''})(.*)$`) }))
  format.valueSuffix = format.valueSuffix.map(delimiter => ({ ...delimiter, re: new RegExp(`^([^${delimiter.char}]+)(${delimiter.char})(.*)$`) }))

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

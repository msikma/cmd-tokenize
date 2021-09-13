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
  // Whether to use or ignore the terminator option.
  useOptionsTerminator: true
}

/** The format used to unpack argument metadata. */
const defaultFormat = {
  // Delimiters used to distinguish options.
  optionDelimiter: {
    unix: [{ char: '-', isRepeatable: true }],
    windows: [{ char: '/', isRepeatable: false }]
  },
  // Delimiters used to distinguish values.
  valueDelimiter: [{ char: '=' }, { char: ':' }],
  // This argument, when encountered, terminates all options;
  // everything from that point is a regular argument even if it contains a prefix.
  // Used on Unix systems only.
  optionsTerminator: '--'
}

/**
 * Takes the user's options and format and returns them with the defaults merged in.
 */
const mergeDefaults = (userOptions = {}, userFormat = {}) => {
  const options = { ...defaultOptions, ...userOptions }
  const format = { ...defaultFormat, ...userFormat }

  // Pick a set of value delimiters based on the platform.
  const platform = options.useWindowsDelimiters ? 'windows' : 'unix'
  format.optionDelimiters = format.optionDelimiter[platform].map(delimiter => ({ ...delimiter, type: platform, re: new RegExp(`^(${delimiter.char}${delimiter.isRepeatable ? '+' : ''})(.*)$`) }))
  format.valueDelimiters = format.valueDelimiter.map(delimiter => ({ ...delimiter, re: new RegExp(`^([^${delimiter.char}]+)(${delimiter.char})(.*)$`) }))

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

// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

/** The default parsing options. */
const defaultOptions = {
  // Transforms combined options into individual options (e.g. -asdf into -a -s -d -f).
  unpackCombinedOptions: true,
  // Preserves the quotes, instead of removing one layer of depth from them.
  preserveQuotes: false
}

/** The format used to unpack argument metadata. */
const defaultFormat = {
  valuePrefix: [
    { type: 'unix', re: /^(-+)(.*)$/, isCombinable: true },
    { type: 'windows', re: /^(\/+)(.*)$/, isCombinable: false }
  ],
  // If an argument ends with a value suffix, it takes at least one value.
  valueSuffix: [/^([^=]*)(=)$/],
  // Arguments with a : may be split.
  valueSeparator: [':'],
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

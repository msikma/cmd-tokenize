// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { argumentMetadata, unpackCombinedOptionsList } = require('./meta')

/**
 * Unpacks the combined arguments a plain array of arguments
 */
const unpackCombinedOptions = (args, options, format) => {
  if (!options.unpackCombinedOptions) {
    return args
  }
  return unpackCombinedOptionsList(args, options, format)
}

/**
 * Converts all string arguments into objects with a bit more information.
 */
const makeArgumentMetadata = (args, options, format) => {
  const items = []
  let afterTerminator = false
  for (const arg of args) {
    // Note: this returns an array, as a single argument can be unpacked to multiple ones.
    const meta = argumentMetadata(arg, options, format, afterTerminator)

    // If we've stumbled upon the terminator, stop processing options
    // and treat everything as a regular argument from here on.
    if (meta[0].isTerminator) {
      afterTerminator = true
    }

    items.push(...meta)
  }
  return {
    options: {
      ...options,
      format
    },
    items
  }
}

module.exports = {
  makeArgumentMetadata,
  unpackCombinedOptions
}

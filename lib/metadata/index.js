// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { argumentMetadata } = require('./arguments')

/**
 * Converts all string arguments into objects with argument type information.
 */
const makeArgumentMetadata = (args, options, format) => {
  let items = []
  let afterTerminator = false

  for (let n = 0; n < args.length; ++n) {
    const isExec = n === 0 && options.firstIsExec
    const arg = args[n]
    
    // Note: this returns an array, as a single argument can be unpacked to multiple ones.
    const meta = argumentMetadata(arg, options, format, isExec, afterTerminator)

    // If we've stumbled upon the terminator, stop processing options
    // and treat everything as a regular argument from here on.
    if (meta[0].isTerminator) {
      afterTerminator = true
    }

    items.push(meta)
  }

  return items.flat()
}

module.exports = {
  makeArgumentMetadata
}

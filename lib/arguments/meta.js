// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

/**
 * Checks whether the current argument is a terminator.
 */
const findTerminator = (arg, terminatorString, afterTerminator = false) => {
  if (afterTerminator) return false
  return arg === terminatorString
}

/**
 * Returns data about any suffix that might be part of this argument.
 */
const findSuffix = (arg, suffixes, afterTerminator = false) => {
  let suffix = null
  let remainder = arg

  if (!afterTerminator) {
    for (const suffixItem of suffixes) {
      const matches = arg.match(suffixItem)
      if (matches == null || matches[1] === '') {
        continue
      }
      suffix = matches[2]
      remainder = matches[1]
      break
    }
  }

  return {
    metadata: { suffix },
    remainder
  }
}

/**
 * Returns data about any prefix that might be part of this argument.
 */
const findPrefix = (arg, prefixes, afterTerminator = false) => {
  let prefixType = null
  let isCombinable = null
  let prefix = null
  let isLongOption = false
  let isOption = false
  let remainder = arg

  if (!afterTerminator) {
    for (const prefixItem of prefixes) {
      const matches = arg.match(prefixItem.re)
      if (matches == null || matches[2] === '') {
        continue
      }
      prefixType = prefixItem.type
      isCombinable = prefixItem.isCombinable
      prefix = matches[1]
      isLongOption = prefix.length > 1
      isOption = true
      remainder = matches[2]
      break
    }
  }

  return {
    metadata: { prefixType, prefix, isLongOption, isOption },
    isCombinable,
    remainder
  }
}

/**
 * Checks whether an argument is a combined option, e.g. "-ab" meaning "-a" and "-b".
 */
const checkCombinability = (value, prefix, afterTerminator = false, useCombining = true) => {
  return !afterTerminator && useCombining && prefix.isCombinable === true && !prefix.metadata.isLongOption && value.length > 1
}

/**
 * Unpacks combined arguments from a list; this is used by the splitCommand path only,
 * unlike unpackCombinedOptions() which is used by the parseCommand path.
 */
const unpackCombinedOptionsList = (args, options, format) => {
  const items = []
  let afterTerminator = false

  for (const arg of args) {
    const isTerminator = findTerminator(arg, format.optionsTerminator, afterTerminator)
    const prefix = findPrefix(arg, format.valuePrefix, afterTerminator || isTerminator)
    const suffix = findSuffix(prefix.remainder, format.valueSuffix, afterTerminator || isTerminator)
    const value = suffix.remainder

    if (checkCombinability(value, prefix, afterTerminator || isTerminator, options.unpackCombinedOptions)) {
      const prefixChar = prefix.metadata.prefix || ''
      const suffixChar = suffix.metadata.suffix || ''
      for (let n = 0; n < value.length; ++n) {
        const char = value[n]
        const isLast = n === value.length - 1
        items.push(`${prefixChar}${char}${isLast ? suffixChar : ''}`)
      }
    }
    else {
      items.push(arg)
    }

    afterTerminator ||= isTerminator
  }
  return items
}

/**
 * Unpacks an argument if it is a combined argument, and returns them in an array,
 * or returns only the original argument itself wrapped in an array.
 */
const unpackCombinedOptions = (argObject, isCombinedOption) => {
  // In most cases, arguments will not be combined options.
  if (!isCombinedOption) {
    return [{ ...argObject, isUnpacked: false }]
  }

  // Unpack combined options into multiple items.
  const items = []
  for (let n = 0; n < argObject.value.length; ++n) {
    const char = argObject.value[n]
    const isLast = n === argObject.value.length - 1

    // Ensure that pairing is off for all except the last item. This is to ensure that,
    // if an argument like -asdf="a" is passed, only the -f argument is paired and not the rest.
    const isPaired = isLast && argObject.isPaired

    items.push({ ...argObject, isPaired, value: char, isUnpacked: true })
  }
  return items
}

/**
 * Converts an argument string into an object that has more extensive information.
 * 
 * There are several 
 */
const argumentMetadata = (arg, options, format, afterTerminator = false) => {
  const isTerminator = findTerminator(arg, format.optionsTerminator, afterTerminator)
  const noOption = isTerminator || afterTerminator
  const prefix = findPrefix(arg, format.valuePrefix, noOption)
  const suffix = findSuffix(prefix.remainder, format.valueSuffix, noOption)
  const value = suffix.remainder

  // If this is an option with a suffix, it will take the next argument as its content.
  // E.g. --asdf="zxcv" means "zxcv" is always the only value of option --asdf.
  const isPaired = suffix.metadata.suffix != null

  // Unix style options can be combined, e.g. "-ab" meaning two options named "-a" and "-b".
  // At the same time, some programs (like ffmpeg) do not use combined options, and "-ab"
  // simply means one option named "ab". We parse these either way.
  const isCombinedOption = checkCombinability(value, prefix, noOption, options.unpackCombinedOptions)

  const argObject = {
    value,
    ...prefix.metadata,
    ...suffix.metadata,
    isPaired,
    isTerminator,
    afterTerminator,
    originalValue: arg
  }

  // The argument is always returned as an array, usually with just one item.
  // If needed, combined options are split up into multiple items.
  return unpackCombinedOptions(argObject, isCombinedOption)
}

// TODO:
// add option for this:
// Multiple options may follow a hyphen delimiter in a single token if the options do not take arguments. Thus, ‘-abc’ is equivalent to ‘-a -b -c’. 
// will we support?
//  An option and its argument may or may not appear as separate tokens. (In other words, the whitespace separating them is optional.) Thus, -o foo and -ofoo are equivalent. 
// A token consisting of a single hyphen character is interpreted as an ordinary non-option argument. By convention, it is used to specify input from or output to the standard input and output streams. 
//https://www.gnu.org/software/libc/manual/html_node/Argument-Syntax.html


module.exports = {
  argumentMetadata,
  unpackCombinedOptionsList
}

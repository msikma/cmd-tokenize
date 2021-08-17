// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

/**
 * Checks whether the current argument is a terminator.
 */
const findTerminator = (arg, terminatorString, afterTerminator = false, useTerminator = true) => {
  if (afterTerminator || !useTerminator) return false
  return arg === terminatorString
}

/**
 * Returns data about any suffix that might be part of this option.
 * 
 * This takes the result of findPrefix(), as only options can have a suffix.
 */
const findSuffix = (prefix, suffixes, afterTerminator = false) => {
  let suffix = null
  let remainder = prefix.remainder

  if (!afterTerminator && prefix.metadata.isOption) {
    for (const suffixItem of suffixes) {
      const suffixRe = new RegExp(`^([^${suffixItem}]*)(${suffixItem})$`)
      const matches = prefix.remainder.match(suffixRe)
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
 * Helper function for finding an option prefix on an item.
 */
const argumentIsOption = (item, format, afterTerminator = false) => {
  return findPrefix(item, format.valuePrefix, afterTerminator).metadata.isOption
}

/**
 * Checks whether an argument is a combined option, e.g. "-ab" meaning "-a" and "-b".
 */
const checkCombinability = (value, prefix, afterTerminator = false, useCombining = true) => {
  return !afterTerminator && useCombining && prefix.isCombinable === true && !prefix.metadata.isLongOption && value.length > 1
}

/**
 * Unpacks combined arguments from a plain list of arguments.
 */
const unpackCombinedOptionsList = (args, options, format) => {
  const items = []
  let afterTerminator = false

  for (const arg of args) {
    const isTerminator = findTerminator(arg, format.optionsTerminator, afterTerminator, options.useOptionsTerminator)
    const prefix = findPrefix(arg, format.valuePrefix, afterTerminator || isTerminator)
    const suffix = findSuffix(prefix, format.valueSuffix, afterTerminator || isTerminator)
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
 */
const argumentMetadata = (arg, options, format, afterTerminator = false) => {
  const isTerminator = findTerminator(arg, format.optionsTerminator, afterTerminator, options.useOptionsTerminator)
  const noOption = isTerminator || afterTerminator
  const prefix = findPrefix(arg, format.valuePrefix, noOption)
  const suffix = findSuffix(prefix, format.valueSuffix, noOption)
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


module.exports = {
  argumentMetadata,
  findPrefix,
  findSuffix,
  argumentIsOption,
  findTerminator,
  unpackCombinedOptionsList
}

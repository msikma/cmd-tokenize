// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { isString, isArray, isWhitespace } = require('../util')
const { argumentIsOption, findTerminator } = require('../arguments/meta')
const { parsingError } = require('../error')

/**
 * Splits a string by quotes (including prefixed escape slashes) and whitespace,
 * keeping both the quotes, the slashes and the whitespace.
 */
const splitByQuotes = str => {
  return str.split(/(\\*["']|\s)/g).filter(n => n !== '')
}

/**
 * Returns a quotation mark string preceded by a number of slashes, or an empty string
 * if the number of slashes is below 0.
 */
const makeQuote = (char, slashes) => {
  if (slashes < 0) return ''
  return `${'\\'.repeat(Math.max(slashes, 0))}${char}`
}

/**
 * Returns the current quotation depth, meaning the number of slashes before a quote.
 * 
 * This also returns whether this string contains a quotation mark at all.
 */
const getQuoteDepth = (str, quoteChar = `'"`) => {
  const quote = str.match(new RegExp(`[${quoteChar}]`))
  const slashes = str.match(/([\\]+)/)?.[1].length || 0
  return [quote != null, slashes, quote?.[0]]
}

/**
 * Finds the first item in an array that contains a quotation mark with a given quotation depth.
 * 
 * This is used to find where a nested quote ends. The array passed to this function will already
 * have the start section of the quote as its first item. Once the end of the quote is found,
 * its index is returned.
 */
const findEndIndex = (items, quoteDepth, quoteChar) => {
  if (items.length < 2 || quoteDepth === -1) {
    return [items.length, false]
  }

  // Note: start at 1, since 0 is the start quote.
  for (let end = 1; end < items.length; ++end) {
    const [quote, slashes, char] = getQuoteDepth(items[end], quoteChar)
    if (quote && (slashes === quoteDepth && char === quoteChar)) {
      return [end, true]
    }
  }

  return [items.length, false]
}

/**
 * Slices a list of items in two by a specific index.
 */
const sliceQuote = (items, endIndex) => {
  return [items.slice(0, endIndex + 1), items.slice(endIndex + 1)]
}

/**
 * Wraps a set of items in an array if it's "complete", meaning it has a start and end quote.
 * 
 * This allows the items to either be nested, or to be flattened, when it's returned to the caller.
 */
const wrapIfComplete = (items, hasEndQuote) => {
  if (hasEndQuote) {
    return [items]
  }
  return items
}

/**
 * Recursively processes a list of items and returns nested arrays of quotes.
 * 
 * Note: 'depth' here is synonymous to the number of slashes a quoted section will have.
 * So we start at -1, meaning 'not enclosed in quotes at all', then 0, meaning 'enclosed
 * in quotes without slashes', etc.; thus the sections with escaped quotes start at depth 1.
 * 
 */
const walkItems = (flatItems, quoteChar = `"'`, depth = -1, throwOnUnbalancedQuote = false) => {
  const nestedItems = []

  let match
  let [end, foundEndQuote] = findEndIndex(flatItems, depth, quoteChar)
  let [depthItems, remainingItems] = sliceQuote(flatItems, end)

  // When we're at depth 0 (meaning inside a quotation mark) and we can't find
  // its end quote, the user might want the function to throw.
  if (throwOnUnbalancedQuote && !foundEndQuote && depth >= 0) {
    throw parsingError('UNBALANCED_QUOTE', `an unterminated quote was found in the input; remaining items: ${depthItems.join('')}`)
  }

  while (depthItems.length) {
    const item = depthItems[0]
    const [quote, slashes, char] = getQuoteDepth(item)

    // If we've found a quotation mark with a higher nesting depth than the current,
    // put its contents into an array one level deeper than the current.
    if (quote && (slashes > depth || char !== quoteChar)) {
      [match, depthItems, nestedHadEndQuote] = walkItems(depthItems, char, slashes, throwOnUnbalancedQuote)
      nestedItems.push(...match)
    }
    else {
      nestedItems.push(item)
      depthItems.shift()
    }
  }
  
  return [wrapIfComplete(nestedItems, foundEndQuote), remainingItems]
}

/**
 * Iterates through an array of nested quotes and 'downgrades' their surrounding quotation marks,
 * i.e. lowers their level of nesting by one.
 * 
 * This is used to prepare the nested quotes to be processed more easily, on the basis that we don't
 * need quotation marks at depth 1, as we already have the items split correctly, and that means
 * all quotes one level deeper than that can be downgraded one level of escape backslashes.
 * 
 * Essentially, if a user passes the following:
 * 
 *     argument "quoted argument" argument
 * 
 * then we want the following structure for processing:
 * 
 *     ['argument', 'quoted argument', 'argument']
 * 
 * However, if there are nested quotes, these need to be downgraded one level, so that a string like
 * "quoted argument \"with nesting\"" becomes ['quoted argument "with nesting"'].
 */
const downgradeNestedQuotes = (nestedItems, amount = 1, depth = -1) => {
  const downgradedItems = []
  for (let n = 0; n < nestedItems.length; ++n) {
    const item = nestedItems[n]

    if (isArray(item)) {
      downgradedItems.push(downgradeNestedQuotes(item, amount, depth + 1))
    }
    if (isString(item)) {
      // Only items at the start and end are processed, since only those can be quotes.
      // Also, below depth 0 there will never be any quotes.
      if (depth < 0 || n > 0 && n < nestedItems.length - 1) {
        downgradedItems.push(item)
        continue
      }

      // Push a quotation mark with a single slash removed, or an empty string if it has no slashes.
      const [_, slashes, char] = getQuoteDepth(item)
      downgradedItems.push(makeQuote(char, slashes - amount))
    }
  }

  // TODO: necessary??
  if (downgradedItems.length === 2 && downgradedItems[0] === '' && downgradedItems[1] === '') {
    return ['']
  }

  return downgradedItems
}

/**
 * Removes items from a nested structure that are pure whitespace, except for empty strings.
 * 
 * The empty strings need to be preserved, because they indicate an empty quoted argument,
 * e.g. --asdf="" should not lose track of the "" and lose it because of whitespace trimming.
 */
const removeWhitespace = (nestedItems) => {
  const items = []
  for (const item of nestedItems) {
    if (item === '') {
      items.push(item)
      continue
    }
    if (isArray(item)) {
      items.push(removeEmptyStrings(item))
      continue
    }
    const trimmed = item.trim()
    if (trimmed === '') {
      continue
    }
    items.push(item)
  }
  return items
}

/**
 * Trims extra whitespace from items on the lowest depth, and joins items in quotes.
 * 
 * This prepares the items for processing. Whitespace is not significant, except for
 * strings in quotes, where the whitespace is maintained.
 */
const flattenNestedQuotes = (nestedItems, depth = -1) => {
  const flatItems = []
  for (const item of nestedItems) {
    if (isArray(item)) {
      if (depth === -1) {
        flatItems.push(item.flat(Infinity).join(''))
      }
      else {
        flatItems.push(...flattenNestedQuotes(item, depth + 1))
      }
      continue
    }
    flatItems.push(item)
  }
  return flatItems
}

/**
 * Merges arguments that occur next to one another without whitespace separating them.
 * 
 * This is done to merge together mixed quoted and unquoted arguments
 * such as "a"b"c", which should be tokenized as "abc".
 */
const mergeConsecutiveArguments = (flatItems, options, format) => {
  let items = []
  let consecutive = []

  for (const item of flatItems) {
    if (isWhitespace(item)) {
      if (consecutive.length) {
        items.push(consecutive.join(''))
      }
      items.push(item)
      consecutive = []
    }
    else {
      consecutive.push(item)
    }
  }
  if (consecutive.length) {
    items.push(consecutive.join(''))
  }

  return items
}



/**
 * Modifies the split items to handle arguments with separators (suffixes).
 * 
 * Arguments with separators need to be split up into multiple items after the regular splitting
 * has already occurred, as it would complicate the splitting logic otherwise.
 */
const handleSeparators = (flatItems, options, format) => {
  const items = []

  // Ensure we don't do anything after the terminator.
  let afterTerminator = false

  // Only arguments not inside quotes can be split up; if they're quoted,
  // the values are literal.
  for (const item of flatItems) {
    // There shouldn't be any arrays in here, though...
    if (!isString(item) || isWhitespace(item)) {
      items.push(item)
      continue
    }

    const isTerminator = findTerminator(item, format.optionsTerminator, afterTerminator, options.useOptionsTerminator)
    const isOption = argumentIsOption(item, format, isTerminator || afterTerminator)
    
    afterTerminator ||= isTerminator

    // Don't try to separate items that aren't options, as this only applies to them.
    // Also don't handle any items past the terminator, which are always literal.
    if (!isOption || afterTerminator) {
      items.push(item)
      continue
    }

    // Handle suffixes. Note that we do not use findSuffix() here, as that function is only used for
    // arguments that have already been split correctly, which is not yet the case here.
    for (let n = 0; n < format.valueSuffix.length; ++n) {
      const sep = format.valueSuffix[n]
      const split = item.split(sep)

      // We keep the item verbatim if it doesn't contain a separator.
      if (split.length === 1) {
        if (n === format.valueSuffix.length - 1) {
          items.push(item)
          break
        }
        continue
      }

      /*
      TODO: REMOVE??
      // We keep the item verbatim if it doesn't contain a separator, or if the strings
      // on either side are empty (which means we've hit a prefix or suffix).
      if (split.length === 1 || split[0].length === 0 || split[split.length - 1].length === 0) {
        if (n === format.valueSuffix.length - 1) {
          items.push(item)
          break
        }
        continue
      }
      */

      // Add the suffix to the first item, and then join together the other items;
      // for reference, --arg=a should tokenize to ['--arg=', 'a'], but
      // --arg=a=b=c should tokenize to ['--arg=', 'a=b=c'].
      const opt = `${split[0]}${sep}`
      const remainder = split.slice(1).join(sep)
      items.push(opt)
      items.push(remainder)
      break
    }
  }

  return items
}

/**
 * Takes a string and returns nested arrays of quoted text split by whitespace.
 * 
 * This is used to make it easy to process strings with quotation marks that may be nested,
 * e.g. "nesting level 1 \"nesting level 2\" and 1 again" is processed into the following structure:
 * 
 *     ['"nesting level 1', ['\"nesting level 2\"'], 'and 1 again"']
 * 
 * ... except that in the actual output, the inner strings are split by whitespace as well, which is
 * not shown here just to highlight the nesting structure.
 * 
 * If there are no quotation marks anywhere, the output is a flat array with words split by whitespace
 * and quotation marks.
 */
const splitNestedQuotes = (str, throwOnUnbalancedQuote = false) => {
  const flatItems = splitByQuotes(str)
  const [nestedItems] = walkItems(flatItems, `"'`, -1, throwOnUnbalancedQuote)
  return nestedItems
}

module.exports = {
  downgradeNestedQuotes,
  flattenNestedQuotes,
  handleSeparators,
  mergeConsecutiveArguments,
  splitNestedQuotes,
  removeWhitespace
}

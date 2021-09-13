// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

/**
 * Takes an input string and modifies the amount of slashes that precede quotes.
 */
const alterQuoteDepth = (input, quoteChar, amount = 0) => {
  if (amount === 0 || !quoteChar) {
    return input
  }
  return input.replace(
    new RegExp(`(\\+)?(${quoteChar})`, 'g'),
    (_, slashes = '') => {
      if (amount < 0) {
        return `${'\\'.repeat(Math.max(slashes.length + amount, 0))}${quoteChar}`
      }
      else {
        return `${slashes}${'\\'.repeat(amount)}${quoteChar}`
      }
    }
  )
}

/**
 * Modifies the slash "depth" (amount) of an input string.
 */
const alterSlashDepth = (input, amount = 0) => {
  if (amount === 0) {
    return input
  }
  return input.replace(
    /(\\+)/g,
    (_, slashes) => {
      let len
      if (amount < 0) {
        if (slashes.length <= 2) {
          len = slashes.length - 1
        }
        else {
          len = Math.ceil(slashes.length / 2)
        }
        return '\\'.repeat(len)
      }
      else {
        return '\\'.repeat(slashes.length * 2)
      }
    }
  )
}

/**
 * Removes slashes from a string; used when escaping.
 */
const addSlashes = (input, quoteChar, amount = 1) => {
  let output = input
  output = alterSlashDepth(output, amount)
  output = alterQuoteDepth(output, quoteChar, amount)
  return output
}

/**
 * Removes slashes from a string; used whem unescaping.
 */
const removeSlashes = (input, quoteChar, amount = 1) => {
  let output = input
  output = alterQuoteDepth(output, quoteChar, -amount)
  output = alterSlashDepth(output, -amount)
  return output
}

module.exports = {
  alterQuoteDepth,
  alterSlashDepth,
  addSlashes,
  removeSlashes
}

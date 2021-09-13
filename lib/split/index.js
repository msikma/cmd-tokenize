// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { ParseError } = require('../error')
const { isWhitespace, isEscapeChar, isQuoteChar, isString, reprObject } = require('../util')

/**
 * Takes a command string and returns an array of distinct argument blocks.
 * 
 * A command is anything the user may type into a terminal, such as `ls -lah`
 * or `find -type f -name '*.js'`. The argument blocks are the individual words
 * separated by spaces, with quoted sections having its internal spaces preserved.
 * Quoted sections are called "quotes" and whitespace-separated sections
 * are called "words".
 * 
 * For example, here's how the aforementioned `find` command would be split up:
 * 
 *     find -type f -name '*.js'
 *     [ 'find', '-type', 'f', '-name', '*.js' ]
 * 
 * Note that the outer quote characters around `*.js` were removed. These are no longer
 * needed when processing the input in Javascript.
 * 
 * There are several caveats and edge cases to be aware of regarding escape sequences.
 * Backslashes can be used to escape whitespace, single and double quotes, and itself;
 * inside of a quoted section, they escape only the outer quote character and itself.
 * 
 * During parsing, escape sequences are replaced with the characters they escape,
 * so for example `\"` becomes just a `"` double quote.
 */
const splitArgumentBlocks = (input, options) => {
  let char = null
  let index = null

  /** Returns a ParseError with our current state. */
  function parseError(message) {
    return new ParseError(message, char, index)
  }

  /** Move the parser up one character. */
  function next() {
    index += 1
    char = input[index] || null
  }

  /** Joins a block together. */
  function joinBlock(arr) {
    return [...arr].join('')
  }

  /** Passes whitespace; used when outside of a quote. */
  function skipWhitespace() {
    while (char && isWhitespace(char)) {
      next()
    }
  }

  /**
   * Yields the contents of a quoted section.
   * 
   * A quoted section starts with a quote character (' or ") and ends
   * when the same quote character is encountered, except for escaped quotes.
   * 
   * Internal whitespace is preserved, escape sequences are unescaped,
   * and the outer quote characters are discarded.
   * 
   * This function throws a parse error if it's not called at the start
   * of a quote, or if the input ends before the quoted section is over.
   */
  function* yieldQuote() {
    // Outer quote character; the quote ends when this is encountered unescaped.
    const quoteChar = char
    const quoteIndex = index

    next()

    while (true) {
      // If there's no more characters, the input has ended on an unclosed quote.
      if (char == null) {
        throw parseError(`Unterminated quote at char ${quoteIndex}: ${input}`)
      }
      // When encountering the end quote, stop seeking.
      else if (char === quoteChar) {

        next()

        // If the input ends or if there's whitespace, we go back to yieldArguments().
        // This is the regular case.
        if (char == null || isWhitespace(char)) {
          break
        }
        // If another quote character follows, it means two quotes were adjacent with
        // no whitespace in between. In this case, the quotes are merged together.
        if (isQuoteChar(char)) {
          yield joinBlock(yieldQuote())
          break
        }
        // If a quoted section is immediately followed by a word, it too is merged.
        // This also covers the case where a quote is followed by an escaped space.
        else {
          yield joinBlock(yieldWord())
          break
        }
      }
      // Handle escape sequences.
      else if (isEscapeChar(char)) {

        next()

        if (char === '\\') {
          yield '\\'
        }
        else if (char === quoteChar) {
          yield char
        }
        // Inside of a quote, only the outer quote character and the backslash
        // character can be escaped. Everything else keeps the superfluous backslash.
        else {
          yield '\\'
          yield char
        }
      }
      // Everything else is part of the quote.
      else {
        yield char
      }

      next()
    }
  }

  /**
   * Yields the contents of an unquoted section.
   * 
   * An unquoted section ends when whitespace is encountered, except for escaped whitespace. 
   * A backslash can be used to escape whitespace, single and double quotes, and itself.
   */
  function* yieldWord() {
    while (char) {
      // Handle all escape sequences.
      if (isEscapeChar(char)) {
        
        next()

        // The input cannot end on a trailing escape character.
        if (char == null) {
          throw parseError('Trailing escape character')
        }
        else if (char === '\\') {
          yield '\\'
        }
        else {
          yield char
        }
      }
      // If a word is followed directly by a quote, the two get merged together.
      else if (isQuoteChar(char)) {
        yield joinBlock(yieldQuote())
        break
      }
      // End the word if whitespace is encountered.
      else if (isWhitespace(char)) {
        break
      }
      // Everything else is part of the word.
      else {
        yield char
      }

      next()
    }
  }

  /**
   * Yields all argument blocks from the input.
   * 
   * All whitespace is discarded except where part of a quote or word.
   */
  function* yieldArguments() {
    skipWhitespace()

    while (char) {
      if (isQuoteChar(char)) {
        yield joinBlock(yieldQuote(), char)
      }
      else {
        yield joinBlock(yieldWord())
      }

      skipWhitespace()
    }
  }

  /**
   * Runs the parser and returns all distinct quotes and words.
   * 
   * This throws if input is passed that isn't a string.
   */
  const parseInput = () => {
    if (!isString(input)) {
      throw parseError(`splitArgumentBlocks: Input must be a string: ${reprObject(input)}`)
    }

    char = ` `
    index = -1
    output = [...yieldArguments()]

    return output
  }

  // Start the parser.
  return parseInput()
}

module.exports = {
  splitArgumentBlocks
}

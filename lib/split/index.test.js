// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { ParseError } = require('../error')
const { splitArgumentBlocks } = require('./index')

describe(`cmd-tokenize argument splitter`, () => {
  describe(`splitArgumentBlocks()`, () => {
    it(`splits the input string into an array of distinct arguments`, () => {
      const tests = [
        [`prog hello world`, [`prog`, `hello`, `world`]],
        [`prog hello "world"`, [`prog`, `hello`, `world`]],
        [`prog "hello world"`, [`prog`, `hello world`]],
        [`prog "hello  world"`, [`prog`, `hello  world`]],
        [`prog --world`, [`prog`, `--world`]],
        [`prog --hello="world"`, [`prog`, `--hello=world`]],
        [`prog --hello="foo bar"`, [`prog`, `--hello=foo bar`]],
        [`prog -`, [`prog`, `-`]],
        [`prog \\\\`, [`prog`, `\\`]],
        [`prog "\\\\"`, [`prog`, `\\`]],
        [`prog foo bar -- baz`, [`prog`, `foo`, `bar`, `--`, `baz`]],
        [` prog foo bar -- baz `, [`prog`, `foo`, `bar`, `--`, `baz`]]
      ]
      for (const test of tests) {
        expect(splitArgumentBlocks(test[0])).toMatchObject(test[1])
      }
    })
    it(`ignores unescaped whitespace characters outside of quotes`, () => {
      const tests = [
        [`a  b`, ['a', 'b']],
        [`a            b`, ['a', 'b']],
        [`     a             b    `, ['a', 'b']],
        [` a b `, ['a', 'b']],
        [` a    "a      b"     b `, ['a', 'a      b', 'b']],
        [` a    'a      b'     b `, ['a', 'a      b', 'b']],
        [`a     \\      b`, ['a', ' ', 'b']],
        [`a     \\ \\     b`, ['a', '  ', 'b']],
        [`a     \\ \\     b\\ `, ['a', '  ', 'b ']]
      ]
      for (const test of tests) {
        expect(splitArgumentBlocks(test[0])).toMatchObject(test[1])
      }
    })
    it(`handles escaped backslash characters`, () => {
      const tests = [
        [`a \\\\`, ['a', '\\']],
        [`a \\\\\\\\`, ['a', '\\\\']],
        [`a "a\\a"`, ['a', 'a\\a']],
        [`a "a\\\\a"`, ['a', 'a\\a']],
        [`a 'a\\a'`, ['a', 'a\\a']],
        [`a 'a\\\\a'`, ['a', 'a\\a']]
      ]
      for (const test of tests) {
        expect(splitArgumentBlocks(test[0])).toMatchObject(test[1])
      }
    })
    it(`handles escaped quote characters`, () => {
      const tests = [
        [`a "zx\\"cv"`, ['a', 'zx"cv']],
        [`a "zx'cv"`, ['a', 'zx\'cv']],
        [`a "zx\\'cv"`, ['a', 'zx\\\'cv']],
        [`a \\"`, ['a', '"']],
        [`a \\'`, ['a', `'`]]
      ]
      for (const test of tests) {
        expect(splitArgumentBlocks(test[0])).toMatchObject(test[1])
      }
    })
    it(`handles escaped whitespace characters`, () => {
      const tests = [
        [`a\\ `, ['a ']],
        [`a\\ b`, ['a b']],
        [`a\\ \\ b`, ['a  b']],
        [`a\\  b`, ['a ', 'b']]
      ]
      for (const test of tests) {
        expect(splitArgumentBlocks(test[0])).toMatchObject(test[1])
      }
    })
    it(`merges adjacent quoted and unquoted sections`, () => {
      const tests = [
        [`a "a"\\ b`, ['a', 'a b']],
        [`a "a"\\ \\ b`, ['a', 'a  b']],
        [`a "a"b`, ['a', 'ab']],
        [`a "a""b"`, ['a', 'ab']],
        [`a "a"'b'`, ['a', 'ab']],
        [`a 'a''b'`, ['a', 'ab']],
        [`a 'a'"b"`, ['a', 'ab']],
        [`a 'a'b`, ['a', 'ab']],
        [`a a'b'`, ['a', 'ab']],
        [`a a"b"`, ['a', 'ab']],
        [`a a\\ "b"`, ['a', 'a b']],
        [`a a\\ \\ "b"`, ['a', 'a  b']]
      ]
      for (const test of tests) {
        expect(splitArgumentBlocks(test[0])).toMatchObject(test[1])
      }
    })
    it(`throws on input that isn't a string`, () => {
      expect(() => splitArgumentBlocks(1)).toThrow(ParseError)
      expect(() => splitArgumentBlocks(['a', 'b'])).toThrow(ParseError)
      expect(() => splitArgumentBlocks({ a: 'b' })).toThrow(ParseError)
      expect(() => splitArgumentBlocks(Symbol('aasdf asdf zxcv'))).toThrow(ParseError)

      expect(() => splitArgumentBlocks('a b c')).not.toThrow(ParseError)
      expect(() => splitArgumentBlocks(new String('a b c'))).not.toThrow(ParseError)
    })
    it(`throws on input with an unclosed quote`, () => {
      expect(() => splitArgumentBlocks('a "a')).toThrow(/Unterminated quote/)
      expect(() => splitArgumentBlocks('a "a')).toThrow(ParseError)
      expect(() => splitArgumentBlocks('a "a"')).not.toThrow(/Unterminated quote/)
      expect(() => splitArgumentBlocks('a "a"')).not.toThrow(ParseError)
      expect(() => splitArgumentBlocks('a b c')).not.toThrow(/Unterminated quote/)
      expect(() => splitArgumentBlocks('a b c')).not.toThrow(ParseError)
    })
    it(`throws on input with a trailing escape character`, () => {
      expect(() => splitArgumentBlocks('a b \\')).toThrow(new ParseError('Trailing escape character'))
      expect(() => splitArgumentBlocks('a b \\\\\\')).toThrow(new ParseError('Trailing escape character'))
      expect(() => splitArgumentBlocks('a b \\\\')).not.toThrow(new ParseError('Trailing escape character'))
      expect(() => splitArgumentBlocks('a b \\\\\\\\')).not.toThrow(new ParseError('Trailing escape character'))
      expect(() => splitArgumentBlocks('a b \\"')).not.toThrow(new ParseError('Trailing escape character'))
    })
  })
})

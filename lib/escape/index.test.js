// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { escapeArgument, EscapeError } = require('./index')

describe(`cmd-tokenize argument escaper`, () => {
  describe(`escapeArgument()`, () => {
    it(`wraps an argument in quotes if it contains single or double quotes`, () => {
      const tests = [
        [`ab'cd`, `"ab'cd"`],
        [`ab"cd`, `'ab"cd'`],
        [`ab"'cd`, `"ab\\"'cd"`]
      ]
      for (const test of tests) {
        expect(escapeArgument(test[0])).toBe(test[1])
      }
    })
    it(`places trailing backslashes outside of the quotation marks`, () => {
      const tests = [
        [`ab cd\\`, `'ab cd'\\\\`],
        [`ab' 'cd\\`, `"ab' 'cd"\\\\`],
        [`ab\\ cd\\`, `'ab\\\\ cd'\\\\`],
        [`ab cd\\\\`, `'ab cd'\\\\\\\\`],
        [`"as'df"\\`, `"\\"as'df\\""\\\\`]
      ]
      for (const test of tests) {
        expect(escapeArgument(test[0])).toBe(test[1])
      }
    })
    it(`escapes quotes`, () => {
      const tests = [
        [`ab"cd`, `'ab\"cd'`],
        [`a\"b\"cd`, `'a\"b\"cd'`],
        [`a\\"b\\"cd`, `'a\\\\"b\\\\"cd'`],
        [`ab'cd`, `"ab\'cd"`],
        [`a\'b\'cd`, `"a\'b\'cd"`],
        [`a\\'b\\'cd`, `"a\\\\'b\\\\'cd"`],
        [`'ab\\'zxcv\\'cd'`, `"'ab\\\\'zxcv\\\\'cd'"`],
        [`'ab\\"zxcv\\"cd'`, `"'ab\\\\\\"zxcv\\\\\\"cd'"`]
      ]
      for (const test of tests) {
        expect(escapeArgument(test[0])).toBe(test[1])
      }
    })
    it(`escapes backslashes`, () => {
      const tests = [
        [`ab\\cd`, `ab\\\\cd`],
        [`ab\\\\cd`, `ab\\\\\\\\cd`]
      ]
      for (const test of tests) {
        expect(escapeArgument(test[0])).toBe(test[1])
      }
    })
    it(`does not wrap an argument in quotes if it does not contain quotes or whitespace`, () => {
      const tests = [
        [`as\\df`, `as\\\\df`],
        [`as$!@#$df`, `as$!@#$df`]
      ]
      for (const test of tests) {
        expect(escapeArgument(test[0])).toBe(test[1])
      }
    })
    it(`returns an argument verbatim if it does not contain quotes, whitespace or escape characters`, () => {
      const tests = [
        `abcd`,
        `あ`
      ]
      const testsNot = [
        `ab cd`,
        `ab'cd`,
        `ab"cd`,
        `ab\\cd`,
        `ab\\ cd`
      ]
      for (const test of tests) {
        expect(escapeArgument(test)).toBe(test)
      }
      for (const test of testsNot) {
        expect(escapeArgument(test)).not.toBe(test)
      }
    })
    it(`throws on input that isn't a string`, () => {
      expect(() => escapeArgument(1)).toThrow(EscapeError)
      expect(() => escapeArgument(['a', 'b'])).toThrow(EscapeError)
      expect(() => escapeArgument({ a: 'b' })).toThrow(EscapeError)
      expect(() => escapeArgument(Symbol('aasdf asdf zxcv'))).toThrow(EscapeError)

      expect(() => escapeArgument('a b c')).not.toThrow(EscapeError)
      expect(() => escapeArgument(new String('a b c'))).not.toThrow(EscapeError)
    })
  })
})

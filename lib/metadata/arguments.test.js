// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { ParseError } = require('../error')
const { parseArgument } = require('./arguments')

describe(`cmd-tokenize argument metadata parser`, () => {
  describe(`parseArgument()`, () => {
    it(`parses a single argument the same way as parseCommand() does for a whole command, but without splitting and unescaping`, () => {
      const tests = [
        [`-a`, [
          {
            content: 'a',
            prefix: '-',
            suffix: null,
            isOption: true,
            isLongOption: false,
            isKey: false,
            isValue: false,
            isTerminator: null,
            isExecutable: null,
            isAfterTerminator: null,
            isUnpacked: false,
            originalValue: '-a'
          }
        ]],
        [`-ab`, [
          {
            content: 'a',
            prefix: '-',
            suffix: null,
            isOption: true,
            isLongOption: false,
            isKey: false,
            isValue: false,
            isTerminator: null,
            isExecutable: null,
            isAfterTerminator: null,
            isUnpacked: true,
            originalValue: '-ab'
          },
          {
            content: 'b',
            prefix: '-',
            suffix: null,
            isOption: true,
            isLongOption: false,
            isKey: false,
            isValue: false,
            isTerminator: null,
            isExecutable: null,
            isAfterTerminator: null,
            isUnpacked: true,
            originalValue: '-ab'
          }
        ]],
        [`-ab="c"`, [
          {
            content: 'a',
            prefix: '-',
            suffix: null,
            isOption: true,
            isLongOption: false,
            isKey: false,
            isValue: false,
            isTerminator: null,
            isExecutable: null,
            isAfterTerminator: null,
            isUnpacked: true,
            originalValue: '-ab="c"'
          },
          {
            content: 'b',
            prefix: '-',
            suffix: '=',
            isOption: true,
            isLongOption: false,
            isKey: true,
            isValue: false,
            isTerminator: null,
            isExecutable: null,
            isAfterTerminator: null,
            isUnpacked: true,
            originalValue: '-ab="c"'
          },
          {
            content: '"c"',
            prefix: null,
            isLongOption: false,
            isOption: false,
            suffix: null,
            isKey: false,
            isValue: true,
            isTerminator: null,
            isExecutable: null,
            isAfterTerminator: null,
            isUnpacked: false,
            originalValue: '-ab="c"'
          }
        ]],
      ]
      for (const test of tests) {
        expect(parseArgument(test[0])).toMatchObject(test[1])
      }
    })
    it(`always sets 'isExecutable', 'isTerminator' and 'isAfterTerminator' to null as these only apply to full commands`, () => {
      const tests = [
        '-a',
        '-ab',
        'asdf',
        '--hello=something',
        '-abc=d'
      ]
      for (const test of tests) {
        for (const arg of parseArgument(test)) {
          expect(arg.isTerminator).toBe(null)
          expect(arg.isAfterTerminator).toBe(null)
          expect(arg.isExecutable).toBe(null)
        }
      }
    })
    it(`throws on input that isn't a string`, () => {
      expect(() => parseArgument(1)).toThrow(ParseError)
      expect(() => parseArgument(['a', 'b'])).toThrow(ParseError)
      expect(() => parseArgument({ a: 'b' })).toThrow(ParseError)
      expect(() => parseArgument(Symbol('aasdf asdf zxcv'))).toThrow(ParseError)

      expect(() => parseArgument('a b c')).not.toThrow(ParseError)
      expect(() => parseArgument(new String('a b c'))).not.toThrow(ParseError)
    })
  })
})

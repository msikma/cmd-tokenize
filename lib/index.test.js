// cmd-tokenize <https://github.com/msikma/cmd-tokenize>
// © MIT license

const { ParseError } = require('./error')
const { splitCommand, parseCommand, splitArguments, parseArguments } = require('./index')

// Returns a parsed argument object's default values.
const arg = (arg, overrides = {}) => ({ content: arg, prefix: null, isExecutable: false, isLongOption: false, isOption: false, suffix: null, isKey: false, isValue: false, isTerminator: false, isAfterTerminator: false, originalValue: arg, isUnpacked: false, ...overrides })
const exec = (value, overrides = {}) => ({ ...arg(value, { isExecutable: true, ...overrides }) })
const shortOpt = (value, overrides = {}) => ({ ...arg(value, { isOption: true, prefix: '-', originalValue: `-${value}`, ...overrides }) })
const shortOptW = (value, overrides = {}) => ({ ...arg(value, { isOption: true, prefix: '/', originalValue: `/${value}`, ...overrides }) })
const longOpt = (value, overrides = {}) => ({ ...arg(value, { isOption: true, isLongOption: true, prefix: '--', originalValue: `--${value}`, ...overrides }) })
const keyValue = (key, value, prefix, suffix, overrides = {}) => (
  (sharedValues) => [
    { ...arg(key, { isKey: true, ...sharedValues }) },
    { ...arg(value, { isValue: true, ...sharedValues, isUnpacked: false, prefix: null, suffix: null, isOption: false, isLongOption: false }) }
  ]
)({ isOption: true, isLongOption: prefix === '--', prefix, suffix, originalValue: `${prefix}${key}${suffix}${value}`, ...overrides })

describe(`cmd-tokenize package`, () => {
  describe(`splitCommand()`, () => {
    it(`splits basic commands`, () => {
      expect(splitCommand('run_program')).toStrictEqual(['run_program'])
      expect(splitCommand('run_program -a')).toStrictEqual(['run_program', '-a'])
      expect(splitCommand('run_program -a -b')).toStrictEqual(['run_program', '-a', '-b'])
    })
    it(`unescapes individual arguments`, () => {
      expect(splitCommand(`'"\\'a\\'"'`)).toStrictEqual([`"'a'"`])
      expect(splitCommand(`'\\'a\\''`)).toStrictEqual([`'a'`])
      expect(splitCommand(`'\\'\\\\'a\\\\'\\''`)).toStrictEqual([`'\\a\\'`])
      expect(splitCommand('a\\ b')).toStrictEqual(['a b'])
      expect(splitCommand('a\\\\ b')).toStrictEqual(['a\\', 'b'])
      expect(splitCommand('"\\"a\\""')).toStrictEqual(['"a"'])
      expect(splitCommand('"\\"\\\\\\"a\\\\\\"\\""')).toStrictEqual(['"\\"a\\""'])
      expect(splitCommand('a')).toStrictEqual(['a'])
      expect(splitCommand(`'a'`)).toStrictEqual(['a'])
      expect(splitCommand(`'"a"'`)).toStrictEqual([`"a"`])
      expect(splitCommand(`a "don't 'do' \\"that\\""`)).toStrictEqual(['a', `don't 'do' "that"`])
    })
  })
  describe(`parseCommand()`, () => {
    it(`parses commands`, () => {
      expect(parseCommand('run_program')).toMatchObject({
        command: 'run_program',
        commandSplit: ['run_program'],
        arguments: [
          exec('run_program')
        ],
        options: {}
      })
      expect(parseCommand(`a --b="c"`).arguments).toMatchObject([
        exec('a'),
        ...keyValue('b', 'c', '--', '='),
      ])
      expect(parseCommand(`run_program hello world "hello world" -a -a -b -b --a sadf  -n asdf  --some_value="something" --another-value="some thing" --yet_another_value="a  \\"quoted value\\""  --a --b --z="dsf" -asdf --d=\\"sdf\\" --d = - -- --zap --sdf`, { unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('run_program'),
        arg('hello'),
        arg('world'),
        arg('hello world'),
        shortOpt('a'),
        shortOpt('a'),
        shortOpt('b'),
        shortOpt('b'),
        longOpt('a'),
        arg('sadf'),
        shortOpt('n'),
        arg('asdf'),
        ...keyValue('some_value', 'something', '--', '='),
        ...keyValue('another-value', 'some thing', '--', '='),
        ...keyValue('yet_another_value', 'a  "quoted value"', '--', '='),
        longOpt('a'),
        longOpt('b'),
        ...keyValue('z', 'dsf', '--', '='),
        shortOpt('a', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('s', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('d', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('f', { isUnpacked: true, originalValue: '-asdf' }),
        ...keyValue('d', '"sdf"', '--', '='),
        longOpt('d'),
        arg('='),
        arg('-'),
        arg('--', { isTerminator: true }),
        arg('--zap', { isAfterTerminator: true }),
        arg('--sdf', { isAfterTerminator: true })
      ])
      expect(parseCommand(``).arguments).toMatchObject([])
      expect(parseCommand(`asdf --asdf="" " zxcv " " qwer\\" wer \\" "`).arguments).toMatchObject([
        exec('asdf'),
        ...keyValue('asdf', '', '--', '='),
        arg(' zxcv '),
        arg(` qwer" wer " `)
      ])
      expect(parseCommand(`program arg --another-arg -a -asdf --with-value="value" -- --after-terminator`, { unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('program'),
        arg('arg'),
        longOpt('another-arg'),
        shortOpt('a'),
        shortOpt('a', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('s', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('d', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('f', { isUnpacked: true, originalValue: '-asdf' }),
        ...keyValue('with-value', 'value', '--', '='),
        arg('--', { isTerminator: true }),
        arg('--after-terminator', { isAfterTerminator: true })
      ])
      expect(parseCommand(`run_program arg "another arg" "an arg with \\"nested and \\\\\\"super nested\\\\\\" quotes\\"" --a --b -asdf --z="hello" --empty="" -a="b" -abc="d" - = --quotes="quotes 'inner \\"more inner quotes\\" quotes'" -- --post-terminator -asdf -a -b`, { unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('run_program'),
        arg('arg'),
        arg('another arg'),
        arg(`an arg with "nested and \\"super nested\\" quotes"`),
        longOpt('a'),
        longOpt('b'),
        shortOpt('a', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('s', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('d', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('f', { isUnpacked: true, originalValue: '-asdf' }),
        ...keyValue('z', 'hello', '--', '='),
        ...keyValue('empty', '', '--', '='),
        ...keyValue('a', 'b', '-', '='),
        shortOpt('a', { isUnpacked: true, originalValue: '-abc=d', suffix: null }),
        shortOpt('b', { isUnpacked: true, originalValue: '-abc=d', suffix: null }),
        ...keyValue('c', 'd', '-', '=', { isUnpacked: true, originalValue: '-abc=d' }),
        arg('-'),
        arg('='),
        ...keyValue('quotes', `quotes 'inner "more inner quotes" quotes'`, '--', '='),
        arg('--', { isTerminator: true }),
        arg('--post-terminator', { isAfterTerminator: true }),
        arg('-asdf', { isAfterTerminator: true }),
        arg('-a', { isAfterTerminator: true }),
        arg('-b', { isAfterTerminator: true })
      ])
      expect(parseCommand(`a bb=cc cc=a"b"c"d" dd="ee"`).arguments).toMatchObject([
        exec('a'),
        arg('bb=cc'),
        arg('cc=abcd'),
        arg('dd=ee')
      ])
      expect(parseCommand(`a bb=a"b"c"d" z "y" - = -a="d" -a=a=b=c`).arguments).toMatchObject([
        exec('a'),
        arg('bb=abcd'),
        arg('z'),
        arg('y'),
        arg('-'),
        arg('='),
        ...keyValue('a', `d`, '-', '='),
        ...keyValue('a', `a=b=c`, '-', '=')
      ])
      expect(parseCommand(`a -c:v`).arguments).toMatchObject([
        exec('a'),
        ...keyValue('c', `v`, '-', ':')
      ])
      expect(parseCommand(`a --asdf=zxcv=asdf --a="a"b"c"d"e"f --program title=string:st=number b -- asdf --asdf=zxcv=asdf`).arguments).toMatchObject([
        exec('a'),
        ...keyValue('asdf', `zxcv=asdf`, '--', '='),
        ...keyValue('a', `abcdef`, '--', '='),
        longOpt('program'),
        arg('title=string:st=number'),
        arg('b'),
        arg('--', { isTerminator: true }),
        arg('asdf', { isAfterTerminator: true }),
        arg('--asdf=zxcv=asdf', { isAfterTerminator: true })
      ])
      expect(parseCommand(`a "b" "c\\"d\\\\\\"e\\\\\\"\\"" "" f`).arguments).toMatchObject([
        exec('a'),
        arg('b'),
        arg(`c"d\\"e\\""`),
        arg(''),
        arg('f')
      ])
      expect(parseCommand(`a --b:"c"`).arguments).toMatchObject([
        exec('a'),
        ...keyValue('b', `c`, '--', ':')
      ])
      expect(parseCommand(`program --program --title=string:st=number`).arguments).toMatchObject([
        exec('program'),
        longOpt('program'),
        ...keyValue('title', `string:st=number`, '--', '=')
      ])
      expect(parseCommand(`a "a" \\"a\\"asdf b`).arguments).toMatchObject([
        exec('a'),
        arg('a'),
        arg('"a"asdf'),
        arg('b')
      ])
      expect(parseCommand(`command \\\\"zxcv" something`).arguments).toMatchObject([
        exec('command'),
        arg('\\zxcv'),
        arg('something')
      ])
      expect(parseCommand(`command "asdf "xcv dfs`).arguments).toMatchObject([
        exec('command'),
        arg(`asdf xcv`),
        arg('dfs')
      ])
      expect(parseCommand(`command "asdf\\\\"xcv dfs`).arguments).toMatchObject([
        exec('command'),
        arg(`asdf\\xcv`),
        arg('dfs')
      ])
      expect(parseCommand(`command "asdf\\"xcv" dfs`).arguments).toMatchObject([
        exec('command'),
        arg(`asdf"xcv`),
        arg('dfs')
      ])
      expect(parseCommand(`a --asdf="" --asdf=a=""  --asdf=a="b" --asdf=a=\\"b\\" b`).arguments).toMatchObject([
        exec('a'),
        ...keyValue('asdf', ``, '--', '='),
        ...keyValue('asdf', `a=`, '--', '='),
        ...keyValue('asdf', `a=b`, '--', '='),
        ...keyValue('asdf', `a="b"`, '--', '='),
        arg('b')
      ])
      expect(parseCommand(`prog -a= --asdf=a="" --zxcv=""`).arguments).toMatchObject([
        exec('prog'),
        ...keyValue('a', ``, '-', '='),
        ...keyValue('asdf', `a=`, '--', '='),
        ...keyValue('zxcv', ``, '--', '=')
      ])
      expect(parseCommand(`a --arg""`).arguments).toMatchObject([
        exec('a'),
        longOpt('arg')
      ])
      expect(parseCommand(`a --a==`).arguments).toMatchObject([
        exec('a'),
        ...keyValue('a', `=`, '--', '=')
      ])
      expect(parseCommand(`a "a" 'a' '\\'b\\"b\\"b\\''`).arguments).toMatchObject([
        exec('a'),
        arg('a'),
        arg('a'),
        arg(`'b\\"b\\"b'`)
      ])
    })
    it(`parses arguments`, () => {
      expect(parseCommand('run_program').arguments).toMatchObject([
        exec('run_program')
      ])
    })
    it(`parses short options`, () => {
      expect(parseCommand('run_program -a').arguments).toMatchObject([
        exec('run_program'),
        shortOpt('a')
      ])
      expect(parseCommand('run_program -a -b').arguments).toMatchObject([
        exec('run_program'),
        shortOpt('a'),
        shortOpt('b')
      ])
    })
    it(`parses long options`, () => {
      expect(parseCommand('run_program --asdf').arguments).toMatchObject([
        exec('run_program'),
        longOpt('asdf')
      ])
      expect(parseCommand('run_program --asdf --zxcv').arguments).toMatchObject([
        exec('run_program'),
        longOpt('asdf'),
        longOpt('zxcv')
      ])
    })
    it(`parses empty quotes as empty strings`, () => {
      expect(parseCommand('a "" "a"').arguments).toMatchObject([
        exec('a'),
        arg(''),
        arg('a')
      ])
      expect(parseCommand('a --arg=""').arguments).toMatchObject([
        exec('a'),
        ...keyValue('arg', ``, '--', '=')
      ])
      expect(parseCommand('a --arg""').arguments).toMatchObject([
        exec('a'),
        longOpt('arg')
      ])
      expect(parseCommand(`prog -a= --asdf=a="" --zxcv=""`).arguments).toMatchObject([
        exec('prog'),
        ...keyValue('a', ``, '-', '='),
        ...keyValue('asdf', `a=`, '--', '='),
        ...keyValue('zxcv', ``, '--', '=')
      ])
    })
    it(`parses -, = and : as distinct non-option arguments`, () => {
      expect(parseCommand(`a - b = c : d`).arguments).toMatchObject([
        exec('a'),
        arg('-'),
        arg('b'),
        arg('='),
        arg('c'),
        arg(':'),
        arg('d')
      ])
      expect(parseCommand(`a --a =`).arguments).toMatchObject([
        exec('a'),
        longOpt('a'),
        arg('=')
      ])
      expect(parseCommand(`a --a==`).arguments).toMatchObject([
        exec('a'),
        ...keyValue('a', `=`, '--', '=')
      ])
    })
    it(`preserves -, = and : literally inside non-option arguments`, () => {
      expect(parseCommand(`program --asdf-zxcv`).arguments).toMatchObject([
        exec('program'),
        longOpt('asdf-zxcv')
      ])
      expect(parseCommand(`program --asdf--zxcv`).arguments).toMatchObject([
        exec('program'),
        longOpt('asdf--zxcv')
      ])
      expect(parseCommand(`program --asdf="zx:cv"`).arguments).toMatchObject([
        exec('program'),
        ...keyValue('asdf', `zx:cv`, '--', '=')
      ])
      expect(parseCommand(`program asdf-zxcv`).arguments).toMatchObject([
        exec('program'),
        arg('asdf-zxcv')
      ])
      expect(parseCommand(`program asdf--zxcv`).arguments).toMatchObject([
        exec('program'),
        arg('asdf--zxcv')
      ])
      expect(parseCommand(`program asdf=zxcv`).arguments).toMatchObject([
        exec('program'),
        arg('asdf=zxcv')
      ])
      expect(parseCommand(`program asdf:zxcv`).arguments).toMatchObject([
        exec('program'),
        arg('asdf:zxcv')
      ])
      expect(parseCommand(`program asdf="zxcv"`).arguments).toMatchObject([
        exec('program'),
        arg('asdf=zxcv')
      ])
    })
    it(`preserves arguments enclosed in double quotes verbatim`, () => {
      expect(parseCommand('a -abc', { unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('a'),
        shortOpt('a', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('b', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('c', { isUnpacked: true, originalValue: '-abc' })
      ])
      expect(parseCommand('a "-abc"', { unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('a'),
        shortOpt('a', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('b', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('c', { isUnpacked: true, originalValue: '-abc' })
      ])
      expect(parseCommand(`a "'-abc'"`).arguments).toMatchObject([
        exec('a'),
        arg(`'-abc'`)
      ])
      expect(parseCommand(`a '"-abc"'`).arguments).toMatchObject([
        exec('a'),
        arg(`"-abc"`)
      ])
      expect(parseCommand(`a --hello`).arguments).toMatchObject([
        exec('a'),
        longOpt(`hello`)
      ])
      expect(parseCommand(`a "--hello"`).arguments).toMatchObject([
        exec('a'),
        longOpt(`hello`)
      ])
      expect(parseCommand(`a "'--hello'"`).arguments).toMatchObject([
        exec('a'),
        arg(`'--hello'`)
      ])
      expect(parseCommand(`a '"--hello"'`).arguments).toMatchObject([
        exec('a'),
        arg(`"--hello"`)
      ])
    })
    it(`parses Windows style options when 'useWindowsDelimiters' is true`, () => {
      expect(parseCommand('a /aaa /c /d /zxcv', { useWindowsDelimiters: true, unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('a'),
        shortOptW('a', { originalValue: '/aaa', isUnpacked: true }),
        shortOptW('a', { originalValue: '/aaa', isUnpacked: true }),
        shortOptW('a', { originalValue: '/aaa', isUnpacked: true }),
        shortOptW('c'),
        shortOptW('d'),
        shortOptW('z', { originalValue: '/zxcv', isUnpacked: true }),
        shortOptW('x', { originalValue: '/zxcv', isUnpacked: true }),
        shortOptW('c', { originalValue: '/zxcv', isUnpacked: true }),
        shortOptW('v', { originalValue: '/zxcv', isUnpacked: true })
      ])
    })
    it(`pairs options with their next value if a suffix is present`, () => {
      expect(parseCommand('a --asdf=a').arguments).toMatchObject([
        exec('a'),
        ...keyValue('asdf', `a`, '--', '=')
      ])
      expect(parseCommand('a --asdf="a"').arguments).toMatchObject([
        exec('a'),
        ...keyValue('asdf', `a`, '--', '=')
      ])
      expect(parseCommand('a --asdf="" a').arguments).toMatchObject([
        exec('a'),
        ...keyValue('asdf', ``, '--', '='),
        arg('a')
      ])
      expect(parseCommand('a --asdf:a').arguments).toMatchObject([
        exec('a'),
        ...keyValue('asdf', `a`, '--', ':')
      ])
      expect(parseCommand('a -c:v').arguments).toMatchObject([
        exec('a'),
        ...keyValue('c', `v`, '-', ':')
      ])
      expect(parseCommand('a -c:"v"').arguments).toMatchObject([
        exec('a'),
        ...keyValue('c', `v`, '-', ':')
      ])
    })
    it(`unpacks short arguments`, () => {
      expect(parseCommand('a -a -bc -def', { unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('a'),
        shortOpt('a'),
        shortOpt('b', { originalValue: '-bc', isUnpacked: true }),
        shortOpt('c', { originalValue: '-bc', isUnpacked: true }),
        shortOpt('d', { originalValue: '-def', isUnpacked: true }),
        shortOpt('e', { originalValue: '-def', isUnpacked: true }),
        shortOpt('f', { originalValue: '-def', isUnpacked: true })
      ])
      expect(parseCommand('a --a -abc --d', { unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('a'),
        longOpt('a'),
        shortOpt('a', { originalValue: '-abc', isUnpacked: true }),
        shortOpt('b', { originalValue: '-abc', isUnpacked: true }),
        shortOpt('c', { originalValue: '-abc', isUnpacked: true }),
        longOpt('d')
      ])
      expect(parseCommand('a -abc="d"', { unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('a'),
        shortOpt('a', { originalValue: '-abc=d', suffix: null, isKey: false, isUnpacked: true }),
        shortOpt('b', { originalValue: '-abc=d', suffix: null, isKey: false, isUnpacked: true }),
        ...keyValue('c', `d`, '-', '=', { isUnpacked: true, originalValue: '-abc=d' })
      ])
      expect(parseCommand('a -abc -- -abc', { unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('a'),
        shortOpt('a', { originalValue: '-abc', isUnpacked: true }),
        shortOpt('b', { originalValue: '-abc', isUnpacked: true }),
        shortOpt('c', { originalValue: '-abc', isUnpacked: true }),
        arg('--', { isTerminator: true }),
        arg('-abc', { isAfterTerminator: true })
      ])
      expect(parseCommand(`a  -abcd="z"   --a -- -zxcv`, { unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('a'),
        shortOpt('a', { originalValue: '-abcd=z', isUnpacked: true, suffix: null }),
        shortOpt('b', { originalValue: '-abcd=z', isUnpacked: true, suffix: null }),
        shortOpt('c', { originalValue: '-abcd=z', isUnpacked: true, suffix: null }),
        ...keyValue('d', `z`, '-', '=', { isUnpacked: true, originalValue: '-abcd=z' }),
        longOpt('a'),
        arg('--', { isTerminator: true }),
        arg('-zxcv', { isAfterTerminator: true })
      ])
    })
    it(`stops processing options after a terminator argument`, () => {
      expect(parseCommand('run_program -a -b -- -c').arguments).toMatchObject([
        exec('run_program'),
        shortOpt('a'),
        shortOpt('b'),
        arg('--', { isTerminator: true }),
        arg('-c', { isAfterTerminator: true })
      ])
      expect(parseCommand('run_program -a --asdf -- --zxcv').arguments).toMatchObject([
        exec('run_program'),
        shortOpt('a'),
        longOpt('asdf'),
        arg('--', { isTerminator: true }),
        arg('--zxcv', { isAfterTerminator: true })
      ])
    })
    it(`preserves spaces in quotes`, () => {
      expect(parseCommand(`something " something " --asdf=" z "`).arguments).toMatchObject([
        exec('something'),
        arg(' something '),
        ...keyValue('asdf', ` z `, '--', '=')
      ])
      expect(parseCommand(`something " something \\" else \\"  " --asdf=" \\"z\\" "`).arguments).toMatchObject([
        exec('something'),
        arg(' something " else "  '),
        ...keyValue('asdf', ` "z" `, '--', '=')
      ])
    })
    it(`preserves escaped spaces outside of quotes`, () => {
      expect(parseCommand(`foo\\ bar baz`).arguments).toMatchObject([
        exec('foo bar'),
        arg('baz')
      ])
      expect(parseCommand(`foo\\ bar\\ baz`).arguments).toMatchObject([
        exec('foo bar baz')
      ])
      expect(parseCommand(`foo\\ bar\\ baz bap`).arguments).toMatchObject([
        exec('foo bar baz'),
        arg('bap')
      ])
      expect(parseCommand(`foo\\ bar\\ "baz"`).arguments).toMatchObject([
        exec('foo bar baz')
      ])
      expect(parseCommand(`/Users/My username`).arguments).toMatchObject([
        exec('/Users/My'),
        arg('username')
      ])
      expect(parseCommand(`/Users/My\\ username`).arguments).toMatchObject([
        exec('/Users/My username')
      ])
      expect(parseCommand(`"/Users/My username"`).arguments).toMatchObject([
        exec('/Users/My username')
      ])
    })
    it(`parses nested quotes`, () => {
      expect(parseCommand(`program "level0"`).arguments).toMatchObject([
        exec('program'),
        arg('level0')
      ])
      expect(parseCommand(`program "level0" "level0" "\\"level1\\""`).arguments).toMatchObject([
        exec('program'),
        arg('level0'),
        arg('level0'),
        arg('"level1"')
      ])
      expect(parseCommand(`program "level0" "\\"\\\\"level2\\\\"\\""`).arguments).toMatchObject([
        exec('program'),
        arg('level0'),
        arg('"\\level2\\"')
      ])
      expect(parseCommand(`program "level0" "\\\\\\"le\\\\\\"vel2\\\\\\""`).arguments).toMatchObject([
        exec('program'),
        arg('level0'),
        arg('\\"le\\"vel2\\"')
      ])
    })
    it(`preserves multiple suffix characters verbatim`, () => {
      expect(parseCommand('a -a=a=b=c').arguments).toMatchObject([
        exec('a'),
        ...keyValue('a', `a=b=c`, '-', '=')
      ])
      expect(parseCommand('a --asdf=a=b=c').arguments).toMatchObject([
        exec('a'),
        ...keyValue('asdf', `a=b=c`, '--', '=')
      ])
      expect(parseCommand('a aa=bb').arguments).toMatchObject([
        exec('a'),
        arg('aa=bb')
      ])
    })
    it(`preserves combinable options verbatim when 'unpackCombinedOptions' is false`, () => {
      expect(parseCommand('a -something', { unpackCombinedOptions: false }).arguments).toMatchObject([
        exec('a'),
        shortOpt('something')
      ])
    })
    it(`ignores the options terminator when 'useOptionsTerminator' is false`, () => {
      expect(parseCommand(`program --asdf -- --zxcv`, { useOptionsTerminator: true }).arguments).toMatchObject([
        exec('program'),
        longOpt('asdf'),
        arg('--', { isTerminator: true }),
        arg('--zxcv', { isAfterTerminator: true })
      ])
      expect(parseCommand(`program --asdf -- --zxcv`, { useOptionsTerminator: false }).arguments).toMatchObject([
        exec('program', { isTerminator: null, isAfterTerminator: null }),
        longOpt('asdf', { isTerminator: null, isAfterTerminator: null }),
        arg('--', { isTerminator: null, isAfterTerminator: null }),
        longOpt('zxcv', { isTerminator: null, isAfterTerminator: null })
      ])
      expect(parseCommand(`program -abc -- --zxcv`, { useOptionsTerminator: true, unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('program'),
        shortOpt('a', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('b', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('c', { isUnpacked: true, originalValue: '-abc' }),
        arg('--', { isTerminator: true }),
        arg('--zxcv', { isAfterTerminator: true })
      ])
      expect(parseCommand(`program -abc -- --zxcv`, { useOptionsTerminator: false, unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('program', { isTerminator: null, isAfterTerminator: null }),
        shortOpt('a', { isUnpacked: true, originalValue: '-abc', isTerminator: null, isAfterTerminator: null }),
        shortOpt('b', { isUnpacked: true, originalValue: '-abc', isTerminator: null, isAfterTerminator: null }),
        shortOpt('c', { isUnpacked: true, originalValue: '-abc', isTerminator: null, isAfterTerminator: null }),
        arg('--', { isTerminator: null, isAfterTerminator: null }),
        longOpt('zxcv', { isTerminator: null, isAfterTerminator: null })
      ])
      expect(parseCommand(`program -abc -- -zxc`, { useOptionsTerminator: true, unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('program'),
        shortOpt('a', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('b', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('c', { isUnpacked: true, originalValue: '-abc' }),
        arg('--', { isTerminator: true }),
        arg('-zxc', { isAfterTerminator: true })
      ])
      expect(parseCommand(`program -abc -- -zxc`, { useOptionsTerminator: false, unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('program', { isTerminator: null, isAfterTerminator: null }),
        shortOpt('a', { isUnpacked: true, originalValue: '-abc', isTerminator: null, isAfterTerminator: null }),
        shortOpt('b', { isUnpacked: true, originalValue: '-abc', isTerminator: null, isAfterTerminator: null }),
        shortOpt('c', { isUnpacked: true, originalValue: '-abc', isTerminator: null, isAfterTerminator: null }),
        arg('--', { isTerminator: null, isAfterTerminator: null }),
        shortOpt('z', { isUnpacked: true, originalValue: '-zxc', isTerminator: null, isAfterTerminator: null }),
        shortOpt('x', { isUnpacked: true, originalValue: '-zxc', isTerminator: null, isAfterTerminator: null }),
        shortOpt('c', { isUnpacked: true, originalValue: '-zxc', isTerminator: null, isAfterTerminator: null })
      ])
      const res = parseCommand(`program -abc -- -zxc`, { useOptionsTerminator: false, unpackCombinedOptions: true })
      for (const arg of res.arguments) {
        expect(arg).toMatchObject({ isTerminator: null, isAfterTerminator: null })
      }
    })
    it(`only has expected data in the argument objects`, () => {
      for (const arg of parseCommand(`program -abc="d" --hello --a:c -a:b -- -zxc`).arguments) {
        expect(Object.keys(arg).sort()).toStrictEqual([
          'content',
          'isAfterTerminator',
          'isExecutable',
          'isKey',
          'isLongOption',
          'isOption',
          'isTerminator',
          'isUnpacked',
          'isValue',
          'originalValue',
          'prefix',
          'suffix'
        ])
      }
    })
    it(`contains the expected default options`, () => {
      const res1 = parseCommand('run_program')
      const opts1 = { ...res1.options }
      delete opts1.format
      expect(opts1).toStrictEqual({
        useWindowsDelimiters: false,
        unpackCombinedOptions: true,
        firstIsExec: true,
        useOptionsTerminator: true
      })
      expect(res1.options.format.optionDelimiters).toMatchObject([{ type: 'unix' }])
      expect(res1.options.format.valueDelimiters).toMatchObject([{ char: '=' }, { char: ':' }])
      expect(res1.options.format.optionsTerminator).toBe('--')

      const res2 = parseCommand('run_program /a', { useWindowsDelimiters: true })
      const opts2 = { ...res2.options }
      delete opts2.format
      expect(opts2).toStrictEqual({
        useWindowsDelimiters: true,
        unpackCombinedOptions: true,
        firstIsExec: true,
        useOptionsTerminator: true
      })
      expect(res2.options.format.optionDelimiters).toMatchObject([{ type: 'windows' }])
      expect(res1.options.format.valueDelimiters).toMatchObject([{ char: '=' }, { char: ':' }])
      expect(res2.options.format.optionsTerminator).toBe('--')
    })
    it(`throws when anything other than a string or an array is passed as argument`, () => {
      expect(() => parseCommand(1)).toThrow(ParseError)
      expect(() => parseCommand(null)).toThrow(ParseError)
      expect(() => parseCommand(['a', 'b'])).not.toThrow(ParseError)
      expect(() => parseCommand(-1)).toThrow(ParseError)
      expect(() => parseCommand([])).not.toThrow(ParseError)
      expect(() => parseCommand({})).toThrow(ParseError)
      expect(() => parseCommand(Symbol('a'))).toThrow(ParseError)
      expect(() => parseCommand('command')).not.toThrow(ParseError)
    })
    it(`throws when an unterminated quote is found in the input`, () => {
      expect(() => parseCommand(`command "a"`)).not.toThrow(ParseError)
      expect(() => parseCommand(`command "a"b"c"`)).not.toThrow(ParseError)
      expect(() => parseCommand(`command "a\\"b\\"c"`)).not.toThrow(ParseError)
      expect(() => parseCommand(`command ""`)).not.toThrow(ParseError)
      expect(() => parseCommand(`command "`)).toThrow(ParseError)
      expect(() => parseCommand(`command "asdf xcv dfs`)).toThrow(ParseError)
      expect(() => parseCommand(`command "zxcv\\" something`)).toThrow(ParseError)
      expect(() => parseCommand(`command \\"zxcv" something`)).toThrow(ParseError)

      expect(() => parseCommand(`command "asdf "xcv dfs`)).not.toThrow(ParseError)
      expect(() => parseCommand(`command "asdf" \\"xcv dfs`)).not.toThrow(ParseError)
      expect(() => parseCommand(`command "asdf\\"xcv" dfs`)).not.toThrow(ParseError)
    })
    it(`treats the first item in the input as an executable path`, () => {
      expect(parseCommand(`program not_program`).arguments).toMatchObject([
        exec('program'),
        arg('not_program')
      ])
      expect(parseCommand(`program not_program`).arguments).not.toMatchObject([
        arg('program'),
        exec('not_program')
      ])
      expect(parseCommand(`program`).arguments).toMatchObject([
        exec('program')
      ])
      expect(parseCommand(`program`).arguments).not.toMatchObject([
        arg('program')
      ])
      expect(parseCommand(`program`, { firstIsExec: false }).arguments).toMatchObject([
        arg('program', { isExecutable: null })
      ])
      expect(parseCommand(`program`, { firstIsExec: false }).arguments).not.toMatchObject([
        exec('program')
      ])
      expect(parseCommand(`--something --something`).arguments).toMatchObject([
        exec('--something'),
        longOpt('something')
      ])
      expect(parseCommand(`--something --something`, { firstIsExec: false }).arguments).toMatchObject([
        longOpt('something', { isExecutable: null }),
        longOpt('something', { isExecutable: null })
      ])
      expect(parseCommand(`-abc -abc`, { unpackCombinedOptions: true }).arguments).toMatchObject([
        exec('-abc'),
        shortOpt('a', { originalValue: '-abc', isUnpacked: true }),
        shortOpt('b', { originalValue: '-abc', isUnpacked: true }),
        shortOpt('c', { originalValue: '-abc', isUnpacked: true })
      ])
      expect(parseCommand(`-abc -abc`, { firstIsExec: false, unpackCombinedOptions: true }).arguments).toMatchObject([
        shortOpt('a', { originalValue: '-abc', isUnpacked: true, isExecutable: null }),
        shortOpt('b', { originalValue: '-abc', isUnpacked: true, isExecutable: null }),
        shortOpt('c', { originalValue: '-abc', isUnpacked: true, isExecutable: null }),
        shortOpt('a', { originalValue: '-abc', isUnpacked: true, isExecutable: null }),
        shortOpt('b', { originalValue: '-abc', isUnpacked: true, isExecutable: null }),
        shortOpt('c', { originalValue: '-abc', isUnpacked: true, isExecutable: null })
      ])
    })
  })
  describe(`splitArguments()`, () => {
    it(`returns the result of splitCommand() verbatim`, () => {
      expect(splitArguments('something')).toStrictEqual(splitCommand('something'))
      expect(splitArguments('-abc -a')).toStrictEqual(splitCommand('-abc -a'))
      expect(splitArguments('-abc -a -b')).toStrictEqual(splitCommand('-abc -a -b'))
    })
  })
  describe(`parseArguments()`, () => {
    it(`returns the result of parseCommand() with 'firstIsExec' set to false`, () => {
      const res = parseArguments('run_program')
      const opts = { ...res.options }
      delete opts.format
      expect(opts).toStrictEqual({
        useWindowsDelimiters: false,
        unpackCombinedOptions: true,
        firstIsExec: false,
        useOptionsTerminator: true
      })
      expect(parseArguments(`not_program also_not_program`).arguments).toMatchObject([
        arg('not_program', { isExecutable: null }),
        arg('also_not_program', { isExecutable: null })
      ])
      expect(parseArguments(`--arg --arg2`).arguments).toMatchObject([
        longOpt('arg', { isExecutable: null }),
        longOpt('arg2', { isExecutable: null })
      ])
    })
  })
})

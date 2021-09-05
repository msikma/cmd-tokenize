const { splitCommand, parseCommand } = require('./index')

// Returns a parsed argument object's default values.
const arg = (arg, overrides = {}) => ({ value: arg, prefix: null, prefixType: null, isLongOption: false, isOption: false, suffix: null, isPaired: false, isTerminator: false, afterTerminator: false, originalValue: arg, isUnpacked: false, ...overrides })
const shortOpt = (value, overrides = {}) => ({ ...arg(value, { isOption: true, prefix: '-', originalValue: `-${value}`, prefixType: 'unix', ...overrides }) })
const shortOptW = (value, overrides = {}) => ({ ...arg(value, { isOption: true, prefix: '/', originalValue: `/${value}`, prefixType: 'windows', ...overrides }) })
const longOpt = (value, overrides = {}) => ({ ...arg(value, { isOption: true, isLongOption: true, prefix: '--', originalValue: `--${value}`, prefixType: 'unix', ...overrides }) })

describe(`cmd-tokenize package`, () => {
  describe(`splitCommand()`, () => {
    it(`splits basic commands`, () => {
      expect(splitCommand('run_program')).toStrictEqual(['run_program'])
      expect(splitCommand('run_program -a')).toStrictEqual(['run_program', '-a'])
      expect(splitCommand('run_program -a -b')).toStrictEqual(['run_program', '-a', '-b'])
    })
    it(`unpacks combinable short options`, () => {
      expect(splitCommand('run_program -abc')).toStrictEqual(['run_program', '-a', '-b', '-c'])
      expect(splitCommand('run_program -abc -- -abc')).toStrictEqual(['run_program', '-a', '-b', '-c', '--', '-abc'])
    })
    it(`throws when anything other than a string is passed as argument`, () => {
      expect(() => splitCommand(1)).toThrow()
      expect(() => splitCommand(null)).toThrow()
      expect(() => splitCommand(['a', 'b'])).toThrow()
      expect(() => splitCommand(-1)).toThrow()
      expect(() => splitCommand([])).toThrow()
      expect(() => splitCommand({})).toThrow()
      expect(() => splitCommand(Symbol('a'))).toThrow()
      expect(() => splitCommand('command')).not.toThrow()
    })
    it(`reduces the quotation depth of quoted arguments by one`, () => {
      expect(splitCommand(`'"\\'a\\'"'`)).toStrictEqual([`"'a'"`])
      expect(splitCommand(`'\\'a\\''`)).toStrictEqual([`'a'`])
      expect(splitCommand(`'\\'\\\\'a\\\\'\\''`)).toStrictEqual([`'\\'a\\''`])
      expect(splitCommand(`'\\'\\\\'\\\\\\'a\\\\\\'\\\\'\\''`)).toStrictEqual([`'\\'\\\\'a\\\\'\\''`])
      expect(splitCommand(`'\\'\\\\'"a"\\\\'\\''`)).toStrictEqual([`'\\'"a"\\''`])
      expect(splitCommand(`'\\'\\\\'\\\\\\'"a"\\\\\\'\\\\'\\''`)).toStrictEqual([`'\\'\\\\'"a"\\\\'\\''`])
      expect(splitCommand(`'\\'\\\\'\\\\\\'"\\"a\\""\\\\\\'\\\\'\\''`)).toStrictEqual([`'\\'\\\\'"\\"a\\""\\\\'\\''`])
      expect(splitCommand('a')).toStrictEqual(['a'])
      expect(splitCommand(`'a'`)).toStrictEqual(['a'])
      expect(splitCommand(`'"a"'`)).toStrictEqual([`"a"`])
      expect(splitCommand(`a "don't 'do' \\"that\\""`)).toStrictEqual(['a', `don't 'do' "that"`])
    })
  })
  describe(`parseCommand()`, () => {
    it(`parses commands`, () => {
      expect(parseCommand('run_program')).toMatchObject({
        input: 'run_program',
        inputSplit: ['run_program'],
        arguments: [
          arg('run_program')
        ],
        options: {}
      })
      expect(parseCommand(`run_program hello world "hello world" -a -a -b -b --a sadf  -n asdf  --some_value="something" --another-value="some thing" --yet_another_value="a  \\"quoted value\\""  --a --b --z="dsf" -asdf --d=\\"sdf\\" --d = - -- --zap --sdf`).arguments).toMatchObject([
        arg('run_program'),
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
        longOpt('some_value', { isPaired: true, suffix: '=', originalValue: '--some_value=' }),
        arg('something'),
        longOpt('another-value', { isPaired: true, suffix: '=', originalValue: '--another-value=' }),
        arg('some thing'),
        longOpt('yet_another_value', { isPaired: true, suffix: '=', originalValue: '--yet_another_value=' }),
        arg('a  "quoted value"'),
        longOpt('a'),
        longOpt('b'),
        longOpt('z', { isPaired: true, suffix: '=', originalValue: '--z=' }),
        arg('dsf'),
        shortOpt('a', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('s', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('d', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('f', { isUnpacked: true, originalValue: '-asdf' }),
        longOpt('d', { isPaired: true, suffix: '=', originalValue: '--d=' }),
        arg('\\"sdf\\"'),
        longOpt('d'),
        arg('='),
        arg('-'),
        arg('--', { isTerminator: true }),
        arg('--zap', { afterTerminator: true }),
        arg('--sdf', { afterTerminator: true })
      ])
      expect(parseCommand(``).arguments).toMatchObject([])
      expect(parseCommand(`asdf --asdf="" " zxcv " " qwer\\" wer \\" "`).arguments).toMatchObject([
        arg('asdf'),
        longOpt('asdf', { isPaired: true, suffix: '=', originalValue: '--asdf=' }),
        arg(''),
        arg(' zxcv '),
        arg(` qwer" wer " `)
      ])
      expect(parseCommand(`program arg --another-arg -a -asdf --with-value="value" -- --after-terminator`).arguments).toMatchObject([
        arg('program'),
        arg('arg'),
        longOpt('another-arg'),
        shortOpt('a'),
        shortOpt('a', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('s', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('d', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('f', { isUnpacked: true, originalValue: '-asdf' }),
        longOpt('with-value', { isPaired: true, suffix: '=', originalValue: '--with-value=' }),
        arg('value'),
        arg('--', { isTerminator: true }),
        arg('--after-terminator', { afterTerminator: true })
      ])
      expect(parseCommand(`run_program arg "another arg" "an arg with \\"nested and \\\\"super nested\\\\" quotes\\"" --a --b -asdf --z="hello" --empty="" -a="b" -abc="d" - = --quotes="quotes 'inner \\"more inner quotes\\" quotes'" -- --post-terminator -asdf -a -b`).arguments).toMatchObject([
        arg('run_program'),
        arg('arg'),
        arg('another arg'),
        arg(`an arg with "nested and \\"super nested\\" quotes"`),
        longOpt('a'),
        longOpt('b'),
        shortOpt('a', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('s', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('d', { isUnpacked: true, originalValue: '-asdf' }),
        shortOpt('f', { isUnpacked: true, originalValue: '-asdf' }),
        longOpt('z', { isPaired: true, suffix: '=', originalValue: '--z=' }),
        arg('hello'),
        longOpt('empty', { isPaired: true, suffix: '=', originalValue: '--empty=' }),
        arg(''),
        shortOpt('a', { isPaired: true, suffix: '=', originalValue: '-a=' }),
        arg('b'),
        shortOpt('a', { isUnpacked: true, originalValue: '-abc=', suffix: '=' }),
        shortOpt('b', { isUnpacked: true, originalValue: '-abc=', suffix: '=' }),
        shortOpt('c', { isUnpacked: true, originalValue: '-abc=', suffix: '=', isPaired: true }),
        arg('d'),
        arg('-'),
        arg('='),
        longOpt('quotes', { isPaired: true, suffix: '=', originalValue: '--quotes=' }),
        arg(`quotes 'inner "more inner quotes" quotes'`),
        arg('--', { isTerminator: true }),
        arg('--post-terminator', { afterTerminator: true }),
        arg('-asdf', { afterTerminator: true }),
        arg('-a', { afterTerminator: true }),
        arg('-b', { afterTerminator: true })
      ])
      expect(parseCommand(`a bb=cc cc=a"b"c"d" dd="ee"`).arguments).toMatchObject([
        arg('a'),
        arg('bb=cc'),
        arg('cc=abcd'),
        arg('dd=ee')
      ])
      expect(parseCommand(`a bb=a"b"c"d" z "y" - = -a="d" -a=a=b=c`).arguments).toMatchObject([
        arg('a'),
        arg('bb=abcd'),
        arg('z'),
        arg('y'),
        arg('-'),
        arg('='),
        shortOpt('a', { isPaired: true, suffix: '=', originalValue: '-a=' }),
        arg('d'),
        shortOpt('a', { isPaired: true, suffix: '=', originalValue: '-a=' }),
        arg('a=b=c')
      ])
      expect(parseCommand(`a -c:v`).arguments).toMatchObject([
        arg('a'),
        shortOpt('c', { isPaired: true, suffix: ':', originalValue: '-c:' }),
        arg('v')
      ])
      expect(parseCommand(`a --asdf=zxcv=asdf --a="a"b"c"d"e"f" --program title=string:st=number b -- asdf --asdf=zxcv=asdf`, { throwOnUnbalancedQuote: false }).arguments).toMatchObject([
        arg('a'),
        longOpt('asdf', { isPaired: true, suffix: '=', originalValue: '--asdf=' }),
        arg('zxcv=asdf'),
        longOpt('a', { isPaired: true, suffix: '=', originalValue: '--a=' }),
        arg('abcdef"'),
        longOpt('program'),
        arg('title=string:st=number'),
        arg('b'),
        arg('--', { isTerminator: true }),
        arg('asdf', { afterTerminator: true }),
        arg('--asdf=zxcv=asdf', { afterTerminator: true })
      ])
      expect(parseCommand(`a "b" "c\\"d\\\\"e\\\\"\\"" "" f`).arguments).toMatchObject([
        arg('a'),
        arg('b'),
        arg(`c"d\\"e\\""`),
        arg(''),
        arg('f')
      ])
      expect(parseCommand(`a --b:"c"`).arguments).toMatchObject([
        arg('a'),
        longOpt('b', { suffix: ':', isPaired: true, originalValue: '--b:' }),
        arg('c')
      ])
      expect(parseCommand(`--program --title=string:st=number`).arguments).toMatchObject([
        longOpt('program'),
        longOpt('title', { suffix: '=', isPaired: true, originalValue: '--title=' }),
        arg('string:st=number')
      ])
      expect(parseCommand(`a "a" "a\\"asdf b`, { throwOnUnbalancedQuote: false }).arguments).toMatchObject([
        arg('a'),
        arg('a'),
        arg('"a\\"asdf'),
        arg('b')
      ])
      expect(parseCommand(`command \\"zxcv" something`, { throwOnUnbalancedQuote: false }).arguments).toMatchObject([
        arg('command'),
        arg('\\"zxcv"'),
        arg('something')
      ])
      expect(parseCommand(`command "asdf "xcv dfs`, { throwOnUnbalancedQuote: false }).arguments).toMatchObject([
        arg('command'),
        arg(`asdf xcv`),
        arg('dfs')
      ])
      expect(parseCommand(`command "asdf\\"xcv dfs`, { throwOnUnbalancedQuote: false }).arguments).toMatchObject([
        arg('command'),
        arg(`"asdf\\"xcv`),
        arg('dfs')
      ])
      expect(parseCommand(`command "asdf\\"xcv" dfs`, { throwOnUnbalancedQuote: true }).arguments).toMatchObject([
        arg('command'),
        arg(`asdf"xcv`),
        arg('dfs')
      ])
      expect(parseCommand(`a --asdf="" --asdf=a=""  --asdf=a="b" --asdf=a=\\"b\\" b`).arguments).toMatchObject([
        arg('a'),
        longOpt('asdf', { isPaired: true, suffix: '=', originalValue: '--asdf=' }),
        arg(''),
        longOpt('asdf', { isPaired: true, suffix: '=', originalValue: '--asdf=' }),
        arg('a='),
        longOpt('asdf', { isPaired: true, suffix: '=', originalValue: '--asdf=' }),
        arg('a=b'),
        longOpt('asdf', { isPaired: true, suffix: '=', originalValue: '--asdf=' }),
        arg('a=\\"b\\"'),
        arg('b')
      ])
      expect(parseCommand(`-a= --asdf=a="" --zxcv=""`).arguments).toMatchObject([
        shortOpt('a', { isPaired: true, suffix: '=', originalValue: '-a=' }),
        arg(''),
        longOpt('asdf', { isPaired: true, suffix: '=', originalValue: '--asdf=' }),
        arg('a='),
        longOpt('zxcv', { isPaired: true, suffix: '=', originalValue: '--zxcv=' }),
        arg('')
      ])
      expect(parseCommand(`a --arg""`).arguments).toMatchObject([
        arg('a'),
        longOpt('arg')
      ])
      expect(parseCommand(`a --a==`).arguments).toMatchObject([
        arg('a'),
        longOpt('a', { isPaired: true, suffix: '=', originalValue: '--a=' }),
        arg('=')
      ])
      expect(parseCommand(`a "a" 'a' '\\'b\\"b\\"b\\''`).arguments).toMatchObject([
        arg('a'),
        arg('a'),
        arg('a'),
        arg(`'b\\"b\\"b'`)
      ])
    })
    it(`parses arguments`, () => {
      expect(parseCommand('run_program').arguments).toMatchObject([
        arg('run_program')
      ])
    })
    it(`parses short options`, () => {
      expect(parseCommand('run_program -a').arguments).toMatchObject([
        arg('run_program'),
        shortOpt('a')
      ])
      expect(parseCommand('run_program -a -b').arguments).toMatchObject([
        arg('run_program'),
        shortOpt('a'),
        shortOpt('b')
      ])
    })
    it(`parses long options`, () => {
      expect(parseCommand('run_program --asdf').arguments).toMatchObject([
        arg('run_program'),
        longOpt('asdf')
      ])
      expect(parseCommand('run_program --asdf --zxcv').arguments).toMatchObject([
        arg('run_program'),
        longOpt('asdf'),
        longOpt('zxcv')
      ])
    })
    it(`parses empty quotes as empty strings`, () => {
      expect(parseCommand('a "" "a"').arguments).toMatchObject([
        arg('a'),
        arg(''),
        arg('a')
      ])
      expect(parseCommand('a --arg=""').arguments).toMatchObject([
        arg('a'),
        longOpt('arg', { isPaired: true, originalValue: '--arg=', suffix: '=' }),
        arg('')
      ])
      expect(parseCommand('a --arg""').arguments).toMatchObject([
        arg('a'),
        longOpt('arg')
      ])
      expect(parseCommand(`-a= --asdf=a="" --zxcv=""`).arguments).toMatchObject([
        shortOpt('a', { isPaired: true, originalValue: '-a=', suffix: '=' }),
        arg(''),
        longOpt('asdf', { isPaired: true, originalValue: '--asdf=', suffix: '=' }),
        arg('a='),
        longOpt('zxcv', { isPaired: true, originalValue: '--zxcv=', suffix: '=' }),
        arg('')
      ])
    })
    it(`parses -, = and : as distinct non-option arguments`, () => {
      expect(parseCommand(`a - b = c : d`).arguments).toMatchObject([
        arg('a'),
        arg('-'),
        arg('b'),
        arg('='),
        arg('c'),
        arg(':'),
        arg('d')
      ])
      expect(parseCommand(`a --a =`).arguments).toMatchObject([
        arg('a'),
        longOpt('a'),
        arg('=')
      ])
      expect(parseCommand(`a --a==`).arguments).toMatchObject([
        arg('a'),
        longOpt('a', { isPaired: true, suffix: '=', originalValue: '--a=' }),
        arg('=')
      ])
    })
    it(`preserves -, = and : literally inside non-option arguments`, () => {
      expect(parseCommand(`program --asdf-zxcv`).arguments).toMatchObject([
        arg('program'),
        longOpt('asdf-zxcv')
      ])
      expect(parseCommand(`program --asdf--zxcv`).arguments).toMatchObject([
        arg('program'),
        longOpt('asdf--zxcv')
      ])
      expect(parseCommand(`program --asdf="zx:cv"`).arguments).toMatchObject([
        arg('program'),
        longOpt('asdf', { isPaired: true, suffix: '=', originalValue: '--asdf=' }),
        arg('zx:cv'),
      ])
      expect(parseCommand(`program asdf-zxcv`).arguments).toMatchObject([
        arg('program'),
        arg('asdf-zxcv')
      ])
      expect(parseCommand(`program asdf--zxcv`).arguments).toMatchObject([
        arg('program'),
        arg('asdf--zxcv')
      ])
      expect(parseCommand(`program asdf=zxcv`).arguments).toMatchObject([
        arg('program'),
        arg('asdf=zxcv')
      ])
      expect(parseCommand(`program asdf:zxcv`).arguments).toMatchObject([
        arg('program'),
        arg('asdf:zxcv')
      ])
      expect(parseCommand(`program asdf="zxcv"`).arguments).toMatchObject([
        arg('program'),
        arg('asdf=zxcv')
      ])
    })
    it(`preserves arguments enclosed in double quotes verbatim`, () => {
      expect(parseCommand('a -abc').arguments).toMatchObject([
        arg('a'),
        shortOpt('a', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('b', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('c', { isUnpacked: true, originalValue: '-abc' })
      ])
      expect(parseCommand('a "-abc"').arguments).toMatchObject([
        arg('a'),
        shortOpt('a', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('b', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('c', { isUnpacked: true, originalValue: '-abc' })
      ])
      expect(parseCommand(`a "'-abc'"`).arguments).toMatchObject([
        arg('a'),
        arg(`'-abc'`)
      ])
      expect(parseCommand(`a '"-abc"'`).arguments).toMatchObject([
        arg('a'),
        arg(`"-abc"`)
      ])
      expect(parseCommand(`a --hello`).arguments).toMatchObject([
        arg('a'),
        longOpt(`hello`)
      ])
      expect(parseCommand(`a "--hello"`).arguments).toMatchObject([
        arg('a'),
        longOpt(`hello`)
      ])
      expect(parseCommand(`a "'--hello'"`).arguments).toMatchObject([
        arg('a'),
        arg(`'--hello'`)
      ])
      expect(parseCommand(`a '"--hello"'`).arguments).toMatchObject([
        arg('a'),
        arg(`"--hello"`)
      ])
    })
    it(`parses Windows style options when 'useWindowsDelimiters' is true`, () => {
      expect(parseCommand('a /aaa /c /d /zxcv', { useWindowsDelimiters: true }).arguments).toMatchObject([
        arg('a'),
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
        arg('a'),
        longOpt('asdf', { isPaired: true, originalValue: '--asdf=', suffix: '=' }),
        arg('a')
      ])
      expect(parseCommand('a --asdf="a"').arguments).toMatchObject([
        arg('a'),
        longOpt('asdf', { isPaired: true, originalValue: '--asdf=', suffix: '=' }),
        arg('a')
      ])
      expect(parseCommand('a --asdf="" a').arguments).toMatchObject([
        arg('a'),
        longOpt('asdf', { isPaired: true, originalValue: '--asdf=', suffix: '=' }),
        arg(''),
        arg('a')
      ])
      expect(parseCommand('a --asdf:a').arguments).toMatchObject([
        arg('a'),
        longOpt('asdf', { isPaired: true, originalValue: '--asdf:', suffix: ':' }),
        arg('a')
      ])
      expect(parseCommand('a -c:v').arguments).toMatchObject([
        arg('a'),
        shortOpt('c', { isPaired: true, originalValue: '-c:', suffix: ':' }),
        arg('v')
      ])
      expect(parseCommand('a -c:"v"').arguments).toMatchObject([
        arg('a'),
        shortOpt('c', { isPaired: true, originalValue: '-c:', suffix: ':' }),
        arg('v')
      ])
    })
    it(`unpacks short arguments`, () => {
      expect(parseCommand('a -a -bc -def').arguments).toMatchObject([
        arg('a'),
        shortOpt('a'),
        shortOpt('b', { originalValue: '-bc', isUnpacked: true }),
        shortOpt('c', { originalValue: '-bc', isUnpacked: true }),
        shortOpt('d', { originalValue: '-def', isUnpacked: true }),
        shortOpt('e', { originalValue: '-def', isUnpacked: true }),
        shortOpt('f', { originalValue: '-def', isUnpacked: true })
      ])
      expect(parseCommand('a --a -abc --d').arguments).toMatchObject([
        arg('a'),
        longOpt('a'),
        shortOpt('a', { originalValue: '-abc', isUnpacked: true }),
        shortOpt('b', { originalValue: '-abc', isUnpacked: true }),
        shortOpt('c', { originalValue: '-abc', isUnpacked: true }),
        longOpt('d')
      ])
      expect(parseCommand('a -abc="d"').arguments).toMatchObject([
        arg('a'),
        shortOpt('a', { originalValue: '-abc=', suffix: '=', isPaired: false, isUnpacked: true }),
        shortOpt('b', { originalValue: '-abc=', suffix: '=', isPaired: false, isUnpacked: true }),
        shortOpt('c', { originalValue: '-abc=', suffix: '=', isPaired: true, isUnpacked: true }),
        arg('d')
      ])
      expect(parseCommand('a -abc -- -abc').arguments).toMatchObject([
        arg('a'),
        shortOpt('a', { originalValue: '-abc', isUnpacked: true }),
        shortOpt('b', { originalValue: '-abc', isUnpacked: true }),
        shortOpt('c', { originalValue: '-abc', isUnpacked: true }),
        arg('--', { isTerminator: true }),
        arg('-abc', { afterTerminator: true })
      ])
      expect(parseCommand(`a  -abcd="z"   --a -- -zxcv`).arguments).toMatchObject([
        arg('a'),
        shortOpt('a', { originalValue: '-abcd=', isUnpacked: true, suffix: '=' }),
        shortOpt('b', { originalValue: '-abcd=', isUnpacked: true, suffix: '=' }),
        shortOpt('c', { originalValue: '-abcd=', isUnpacked: true, suffix: '=' }),
        shortOpt('d', { originalValue: '-abcd=', isUnpacked: true, isPaired: true, suffix: '=' }),
        arg('z'),
        longOpt('a'),
        arg('--', { isTerminator: true }),
        arg('-zxcv', { afterTerminator: true })
      ])
    })
    it(`stops processing options after a terminator argument`, () => {
      expect(parseCommand('run_program -a -b -- -c').arguments).toMatchObject([
        arg('run_program'),
        shortOpt('a'),
        shortOpt('b'),
        arg('--', { isTerminator: true }),
        arg('-c', { afterTerminator: true })
      ])
      expect(parseCommand('run_program -a --asdf -- --zxcv').arguments).toMatchObject([
        arg('run_program'),
        shortOpt('a'),
        longOpt('asdf'),
        arg('--', { isTerminator: true }),
        arg('--zxcv', { afterTerminator: true })
      ])
    })
    it(`preserves spaces in quotes`, () => {
      expect(parseCommand(`something " something " --asdf=" z "`).arguments).toMatchObject([
        arg('something'),
        arg(' something '),
        longOpt('asdf', { isPaired: true, originalValue: '--asdf=', suffix: '=' }),
        arg(' z ')
      ])
      expect(parseCommand(`something " something \\" else \\"  " --asdf=" \\"z\\" "`).arguments).toMatchObject([
        arg('something'),
        arg(' something " else "  '),
        longOpt('asdf', { isPaired: true, originalValue: '--asdf=', suffix: '=' }),
        arg(' "z" ')
      ])
    })
    it(`preserves escaped spaces outside of quotes`, () => {
      expect(parseCommand(`foo\\ bar baz`).arguments).toMatchObject([
        arg('foo bar'),
        arg('baz')
      ])
      expect(parseCommand(`foo\\ bar\\ baz`).arguments).toMatchObject([
        arg('foo bar baz')
      ])
      expect(parseCommand(`foo\\ bar\\ baz bap`).arguments).toMatchObject([
        arg('foo bar baz'),
        arg('bap')
      ])
      expect(parseCommand(`foo\\ bar\\ "baz"`).arguments).toMatchObject([
        arg('foo bar baz')
      ])
      expect(parseCommand(`foo\\ bar\\ "baz"`, { preserveQuotes: true }).arguments).toMatchObject([
        arg('foo bar "baz"')
      ])
      expect(parseCommand(`/Users/My username`).arguments).toMatchObject([
        arg('/Users/My'),
        arg('username')
      ])
      expect(parseCommand(`/Users/My\\ username`).arguments).toMatchObject([
        arg('/Users/My username')
      ])
      expect(parseCommand(`"/Users/My username"`).arguments).toMatchObject([
        arg('/Users/My username')
      ])
    })
    it(`parses nested quotes`, () => {
      expect(parseCommand(`program "level0"`).arguments).toMatchObject([
        arg('program'),
        arg('level0')
      ])
      expect(parseCommand(`program "level0" "level0" "\\"level1\\""`).arguments).toMatchObject([
        arg('program'),
        arg('level0'),
        arg('level0'),
        arg('"level1"')
      ])
      expect(parseCommand(`program "level0" "\\"\\\\"level2\\\\"\\""`).arguments).toMatchObject([
        arg('program'),
        arg('level0'),
        arg('"\\"level2\\""')
      ])
      expect(parseCommand(`program "level0" "\\"'level2'\\""`).arguments).toMatchObject([
        arg('program'),
        arg('level0'),
        arg(`"'level2'"`)
      ])
    })
    it(`preserves multiple suffix characters verbatim`, () => {
      expect(parseCommand('a -a=a=b=c').arguments).toMatchObject([
        arg('a'),
        shortOpt('a', { isPaired: true, originalValue: '-a=', suffix: '=' }),
        arg('a=b=c')
      ])
      expect(parseCommand('a --asdf=a=b=c').arguments).toMatchObject([
        arg('a'),
        longOpt('asdf', { isPaired: true, originalValue: '--asdf=', suffix: '=' }),
        arg('a=b=c')
      ])
      expect(parseCommand('a aa=bb').arguments).toMatchObject([
        arg('a'),
        arg('aa=bb')
      ])
    })
    it(`preserves quotes verbatim when 'preserveQuotes' is true`, () => {
      expect(parseCommand(`program "level0"`, { preserveQuotes: true }).arguments).toMatchObject([
        arg('program'),
        arg('"level0"')
      ])
      expect(parseCommand(`program "level0" "level0\\"level1\\""`, { preserveQuotes: true }).arguments).toMatchObject([
        arg('program'),
        arg('"level0"'),
        arg('"level0\\"level1\\""')
      ])
      expect(parseCommand(`program "level0" "level0\\"'level2'\\""`, { preserveQuotes: true }).arguments).toMatchObject([
        arg('program'),
        arg('"level0"'),
        arg(`"level0\\"'level2'\\""`)
      ])
      expect(parseCommand(`program ""`, { preserveQuotes: true }).arguments).toMatchObject([
        arg('program'),
        arg('""')
      ])
      expect(parseCommand(`program "" --asdf=""`, { preserveQuotes: true }).arguments).toMatchObject([
        arg('program'),
        arg('""'),
        longOpt('asdf', { suffix: '=', isPaired: true, originalValue: '--asdf=' }),
        arg('""')
      ])
    })
    it(`preserves combinable options verbatim when 'unpackCombinedOptions' is false`, () => {
      expect(parseCommand('a -something', { unpackCombinedOptions: false }).arguments).toMatchObject([
        arg('a'),
        shortOpt('something')
      ])
    })
    it(`ignores the options terminator when 'useOptionsTerminator' is false`, () => {
      expect(parseCommand(`program --asdf -- --zxcv`, { useOptionsTerminator: true }).arguments).toMatchObject([
        arg('program'),
        longOpt('asdf'),
        arg('--', { isTerminator: true }),
        arg('--zxcv', { afterTerminator: true })
      ])
      expect(parseCommand(`program --asdf -- --zxcv`, { useOptionsTerminator: false }).arguments).toMatchObject([
        arg('program'),
        longOpt('asdf'),
        arg('--'),
        longOpt('zxcv')
      ])
      expect(parseCommand(`program -abc -- --zxcv`, { useOptionsTerminator: true }).arguments).toMatchObject([
        arg('program'),
        shortOpt('a', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('b', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('c', { isUnpacked: true, originalValue: '-abc' }),
        arg('--', { isTerminator: true }),
        arg('--zxcv', { afterTerminator: true })
      ])
      expect(parseCommand(`program -abc -- --zxcv`, { useOptionsTerminator: false }).arguments).toMatchObject([
        arg('program'),
        shortOpt('a', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('b', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('c', { isUnpacked: true, originalValue: '-abc' }),
        arg('--'),
        longOpt('zxcv')
      ])
      expect(parseCommand(`program -abc -- -zxc`, { useOptionsTerminator: true }).arguments).toMatchObject([
        arg('program'),
        shortOpt('a', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('b', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('c', { isUnpacked: true, originalValue: '-abc' }),
        arg('--', { isTerminator: true }),
        arg('-zxc', { afterTerminator: true })
      ])
      expect(parseCommand(`program -abc -- -zxc`, { useOptionsTerminator: false }).arguments).toMatchObject([
        arg('program'),
        shortOpt('a', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('b', { isUnpacked: true, originalValue: '-abc' }),
        shortOpt('c', { isUnpacked: true, originalValue: '-abc' }),
        arg('--'),
        shortOpt('z', { isUnpacked: true, originalValue: '-zxc' }),
        shortOpt('x', { isUnpacked: true, originalValue: '-zxc' }),
        shortOpt('c', { isUnpacked: true, originalValue: '-zxc' })
      ])
    })
    it(`returns the exact same output for <result>.inputSplit as splitCommand()`, () => {
      expect(parseCommand('run_program').inputSplit).toStrictEqual(splitCommand('run_program'))
    })
    it(`contains the expected default options`, () => {
      const res1 = parseCommand('run_program')
      const opts1 = { ...res1.options }
      delete opts1.format
      expect(opts1).toStrictEqual({
        useWindowsDelimiters: false,
        unpackCombinedOptions: true,
        preserveQuotes: false,
        useOptionsTerminator: true,
        throwOnUnbalancedQuote: true
      })
      expect(res1.options.format.valuePrefix).toMatchObject([{ type: 'unix' }])
      expect(res1.options.format.valueSuffix).toMatchObject(['=', ':'])
      expect(res1.options.format.optionsTerminator).toBe('--')

      const res2 = parseCommand('run_program /a', { useWindowsDelimiters: true })
      const opts2 = { ...res2.options }
      delete opts2.format
      expect(opts2).toStrictEqual({
        useWindowsDelimiters: true,
        unpackCombinedOptions: true,
        preserveQuotes: false,
        useOptionsTerminator: true,
        throwOnUnbalancedQuote: true
      })
      expect(res2.options.format.valuePrefix).toMatchObject([{ type: 'windows' }])
      expect(res2.options.format.valueSuffix).toMatchObject(['=', ':'])
      expect(res2.options.format.optionsTerminator).toBe('--')
    })
    it(`preserves unbalanced quotes verbatim if not throwing`, () => {
      expect(parseCommand(`command "asdf xcv dfs`, { throwOnUnbalancedQuote: false }).arguments).toMatchObject([
        arg('command'),
        arg(`"asdf`),
        arg(`xcv`),
        arg(`dfs`)
      ])
      expect(parseCommand(`command "asdf\\"xcv dfs`, { throwOnUnbalancedQuote: false }).arguments).toMatchObject([
        arg('command'),
        arg(`"asdf\\"xcv`),
        arg(`dfs`)
      ])
    })
    it(`throws when anything other than a string is passed as argument`, () => {
      expect(() => parseCommand(1)).toThrow()
      expect(() => parseCommand(null)).toThrow()
      expect(() => parseCommand(['a', 'b'])).toThrow()
      expect(() => parseCommand(-1)).toThrow()
      expect(() => parseCommand([])).toThrow()
      expect(() => parseCommand({})).toThrow()
      expect(() => parseCommand(Symbol('a'))).toThrow()
      expect(() => parseCommand('command')).not.toThrow()
    })
    it(`throws when an unbalanced quote is found in the input`, () => {
      expect(() => parseCommand(`command "a"`)).not.toThrow()
      expect(() => parseCommand(`command "a"b"c"`)).not.toThrow()
      expect(() => parseCommand(`command "a\\"b\\"c"`)).not.toThrow()
      expect(() => parseCommand(`command ""`)).not.toThrow()
      expect(() => parseCommand(`command "`)).toThrow()
      expect(() => parseCommand(`command "asdf xcv dfs`)).toThrow()
      expect(() => parseCommand(`command "zxcv\\" something`)).toThrow()
      expect(() => parseCommand(`command \\"zxcv" something`)).toThrow()

      expect(() => parseCommand(`command "asdf "xcv dfs`)).not.toThrow()
      expect(() => parseCommand(`command "asdf" \\"xcv dfs`)).not.toThrow()
      expect(() => parseCommand(`command "asdf\\"xcv" dfs`)).not.toThrow()

      expect(() => parseCommand(`command "`, { throwOnUnbalancedQuote: false })).not.toThrow()
      expect(() => parseCommand(`command "asdf xcv dfs`, { throwOnUnbalancedQuote: false })).not.toThrow()
      expect(() => parseCommand(`command "zxcv\\" something`, { throwOnUnbalancedQuote: false })).not.toThrow()
      expect(() => parseCommand(`command \\"zxcv" something`, { throwOnUnbalancedQuote: false })).not.toThrow()
    })
  })
})

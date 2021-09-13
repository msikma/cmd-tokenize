[![MIT license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT) [![npm version](https://badge.fury.io/js/cmd-tokenize.svg)](https://badge.fury.io/js/cmd-tokenize)

# cmd-tokenize

A small dependency-free library for converting terminal command strings into a format that's easy to process.

This is not a complete argument parsing library; for that, see [Argon](https://github.com/msikma/argon), for which this library was written. The purpose of this library is to split up terminal commands into separate distinct tokens that can then be processed further.

## Usage

This library is available via npm:

```
npm i --save cmd-tokenize
```

The primary interface is `parseCommand()`, which takes a string of a terminal command and returns an object of parsed arguments.

```js
import { parseCommand } from 'cmd-tokenize'

const result = parseCommand(`exa -la --sort="size"`)
console.log(result)
```

The `result` object will contain the following:

```js
{
  command: 'exa -la --sort="size"',
  commandSplit: ['exa', '-la', '--sort=size'],
  arguments: [
    {
      content: 'exa',
      prefix: null,
      suffix: null,
      isOption: false,
      isLongOption: false,
      isUnpacked: false,
      isKey: false,
      isValue: false,
      isExecutable: true,
      isTerminator: false,
      isAfterTerminator: false,
      originalValue: 'exa'
    },
    {
      content: 'l',
      prefix: '-',
      suffix: null,
      isOption: true,
      isLongOption: false,
      isUnpacked: true,
      isKey: false,
      isValue: false,
      isExecutable: false,
      isTerminator: false,
      isAfterTerminator: false,
      originalValue: '-la'
    },
    {
      content: 'a',
      prefix: '-',
      suffix: null,
      isOption: true,
      isLongOption: false,
      isUnpacked: true,
      isKey: false,
      isValue: false,
      isExecutable: false,
      isTerminator: false,
      isAfterTerminator: false,
      originalValue: '-la'
    },
    {
      content: 'sort',
      prefix: '--',
      suffix: '=',
      isOption: true,
      isLongOption: true,
      isUnpacked: false,
      isKey: true,
      isValue: false,
      isExecutable: false,
      isTerminator: false,
      isAfterTerminator: false,
      originalValue: '--sort=size'
    },
    {
      content: 'size',
      prefix: null,
      suffix: null,
      isOption: false,
      isLongOption: false,
      isUnpacked: false,
      isKey: false,
      isValue: true,
      isExecutable: false,
      isTerminator: false,
      isAfterTerminator: false,
      originalValue: '--sort=size'
    }
  ],
  options: {
    useWindowsDelimiters: false,
    firstIsExec: true,
    unpackCombinedOptions: true,
    useOptionsTerminator: true
  }
}
```

Arguments are split by whitespace, with quoted sections remaining preserved and being unescaped. Both Unix and Windows style delimiters (dash and slash) are supported.

Alternatively, there's `splitCommand()` which only splits the input into distinct arguments without doing any further processing; its output is equivalent to the `result.commandSplit` value returned by `parseCommand()`.

### Reference

**Function:**

```js
parseCommand(command[, { options }])
```

**Parameters:**

* `command` **string**\
  the command to parse
* `options` **object** (optional)\
  a set of options used to change parsing behavior:
  * `unpackCombinedOptions` **boolean**: *true*\
    Breaks up combined options into individual options; an argument like `-abc` becomes `-a`, `-b`, `-c`
  * `useOptionsTerminator` **boolean**: *true*\
    Whether to look for the `--` terminator, which causes subsequent arguments to be interpreted literally
  * `useWindowsDelimiters` **boolean**: *false*\
    Searches for Windows style slash delimiters rather than Unix style dash delimiters (never recommended even on Win
  * `firstIsExec` **boolean**: *true*\
    Treats the first item as the path to the executable

Typically, the only option that's useful to change is `unpackCombinedOptions`. In standard argument parsers, multiple short options such as `-a` may be combined into a single token, like `ls -lah` being equivalent to `ls -l -a -h`. The parser breaks these up so they can be more easily processed. Conversely, if your parser does not distinguish between short and long options, you should set it to *false*—some notable examples of programs with this behavior are `ffmpeg` and `find`, which use long arguments with a single dash, such as `find . -type f -name "*.js"`.

The `useOptionsTerminator` option takes the "terminator" argument into account; this is a Unix convention where passing `--` causes all subsequent arguments to be interpreted literally. For example, when parsing `program --opt -- --opt`, the first `--opt` will be parsed as an option with `isOption` set to *true*, and the second will be parsed as a non-option argument that starts with two dashes. The terminator argument itself will have `isTerminator` set, and all subsequent arguments will have `isAfterTerminator` set.

The `useWindowsDelimiters` option should be set to *true* when writing a parser for commands with Windows style slash arguments, such as `program.exe /a /b /c`. These are fundamentally incompatible with Unix style paths, which are now being used on Windows as well (per the introduction of the [WSL](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux)), so it's recommended that you *always* use Unix style arguments regardless of what platform you're writing for. Note that, if you do parse Windows style slash arguments, you should also set `useOptionsTerminator` to *false* as this is not a convention used on Windows.

The `firstIsExec` option ensures that the first item is parsed correctly if it's the name of the executable (e.g. the `ls` in `ls -lah`); technically an executable file can be named `--something`, which should not be parsed as an argument if it is the executable name. If you don't want to make an exception for the first argument, you can either set this to *false* or use `parseArguments()` instead.

**Throws:**

* `ParseError`\
  Indicates a problem with the given input string

If the given input command contains an unterminated quote or a single trailing escape character, the parser will throw a `ParseError`. Also, if anything other than a string is passed as command, this error will be thrown.

***

**Function:**

```js
splitCommand(command[, { options }])
```

This function takes the exact same arguments as `parseCommand()` (all functions have the same interface), but only returns the input command split up into distinct arguments. Quoted arguments have their whitespace preserved and unescape logic is applied. An options argument can be passed but the options have no effect.

***

**Function:**

```js
parseArguments(command[, { options }])
```

An alias for `parseCommand()`, but with `firstIsExec` set to *false* by default. Use this for when you know your input does not contain an executable at the start.

### Argument metadata

After parsing, each argument will have the following metadata:

| Name | Type | Description |
|:-----|:-----|:------------|
| content | string | String content of the argument with all delimiters stripped; `"foo"` for `--foo` |
| prefix | string&nbsp;\|&nbsp;null | Prefix delimiter, if present; `"--"` for `--foo` |
| suffix | string&nbsp;\|&nbsp;null | Suffix delimiter, if present; `"="` for `--foo="bar"` |
| isOption | boolean | Whether this argument is an option; *true* for `-f` or `--foo`, *false* for `foo` |
| isLongOption | boolean | Whether this argument's option is a double hyphens; *false* for `-f`, *true* for `--foo` |
| isUnpacked | boolean | Whether this argument is a split up combination argument; an argument like `-asdf` becomes `-a`, `-s`, `-d`, `-f` |
| isKey | boolean | Whether this argument is the key in a key-value pair; for `--foo="bar"`, the key item is `foo` |
| isValue | boolean | Whether this argument is the value in a key-value pair; for `--foo="bar"`, the value item is `bar` |
| isExecutable | boolean&nbsp;\|&nbsp;null | Whether this argument is the executable (the first item); *true* for `mkdir` in the command `mkdir -p /some/path`, *false* for the rest of the items; *null* if `firstIsExec` is set to *false* |
| isTerminator | boolean&nbsp;\|&nbsp;null | Whether this is the `"--"` terminator argument; *null* if `useOptionsTerminator` is set to *false* |
| isAfterTerminator | boolean&nbsp;\|&nbsp;null | Whether this argument came after the terminator; *null* if `useOptionsTerminator` is set to *false* |
| originalValue | string | The original string that made up the argument, before any processing was done |

Superfluous whitespace around arguments is stripped, but whitespace internal to a quoted section is preserved. Each argument has its content unescaped, so things like double backslashes or nested quotes end up deslashed:

```js
const result = splitCommand(`foo  " bar " "level 1 \\"level 2 \\\\\\"level 3\\\\\\" level 2\\" level 1"`)
```

In this case, `result` will log as:

```js
['foo', ' bar ', 'level 1 "level 2 \\"level 3\\" level 2" level 1']
```

Note that Node itself also requires that backslashes are escaped in string literals; this result actually has a single backslash character before the quotes around "level 3".

## License

MIT license

# cmd-tokenize

A small dependency-free library for converting terminal command strings into a format that's easy to process.

This is not a complete argument parsing library; for that, see [Argon](https://github.com/msikma/argon), for which this library was written. The purpose of this library is to split up the user's command into separate distinct tokens.

## Usage

This library is available via npm:

```
npm i --save cmd-tokenize
```

The primary interface is `parseCommand()`, which takes a string of a terminal command and returns an object of parsed arguments.

```js
const { parseCommand } = require('cmd-tokenize')

// Something the user entered in their terminal:
const cmd = `program arg --another-arg -z -asdf --with-value="value" -- --after-terminator`
const parsed = parseCommand(cmd)

console.log(parsed)

// {
//   input: 'program arg --another-arg -z -asdf --with-value="value" -- --after-terminator',
//   inputSplit: ['program', 'arg', '--another-arg', '-z', '-a', '-s', '-d', '-f', '--with-value=', 'value', '--', '--after-terminator'],
//   arguments: [
//     {
//       value: 'program',
//       prefix: null,
//       prefixType: null,
//       suffix: null,
//       isOption: false,
//       isLongOption: false,
//       isPaired: false,
//       isTerminator: false,
//       afterTerminator: false,
//       originalValue: 'program',
//       isUnpacked: false
//     },
//     ...
```

Arguments are split by whitespace, with quoted sections remaining preserved. Nested quotes will remain intact. Both Unix and Windows style delimiters (dash and backslash) are supported.

If you want to process the arguments manually and just need them split up, you can do so using `splitCommand()`.

### Options

For both these functions, the following options can be passed in an object as the second argument:

| Name | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| unpackCombinedOptions | boolean | true | Transforms combined options into individual options; an argument like `-asdf` becomes `-a`, `-s`, `-d`, `-f` |
| preserveQuotes | boolean | false | Causes quotation marks around arguments to be preserved exactly |

In standard argument parsers, multiple short options such as `-a` may be combined into a single token; if this is not desirable, the `unpackCombinedOptions` should be set to true. This is useful if your parser does not distinguish between short and long options (one notable example is `ffmpeg`, which uses a single dash for both short and long options).

### Argument metadata

After parsing, each argument will have the following metadata:

| Name | Type | Description |
|:-----|:-----|:------------|
| value | string | String content of the argument with all delimiters stripped; `"foo"` for `--foo` |
| prefix | string&nbsp;\|&nbsp;null | Prefix delimiter, if present; `"--"` for `--foo` |
| prefixType | string&nbsp;\|&nbsp;null | Either `"unix"` or `"windows"` depending on whether the delimiter was a dash or backslash |
| suffix | string&nbsp;\|&nbsp;null | Suffix delimiter, if present; `"="` for `--foo="bar"` |
| isOption | boolean | Whether this argument is an option; true for `-f` or `--foo`, false for `foo` |
| isLongOption | boolean | Whether this argument's option is a double hyphens; false for `-f`, true for `--foo` |
| isPaired | boolean | Whether this argument pairs with the next argument as its value; for `--foo="bar"`, the `foo` object pairs with the `bar` object that comes directly after it. |
| isTerminator | boolean | Whether this is the `"--"` terminator argument—[see the syntax conventions section on Argon's readme page](https://github.com/msikma/argon#syntax-conventions) |
| isUnpacked | boolean | Whether this argument is a split up combination argument; an argument like `-asdf` becomes `-a`, `-s`, `-d`, `-f` |
| afterTerminator | boolean | Whether this argument came after the terminator |
| originalValue | string | The original string that made up the argument, before any processing was done |

The `value` string will be stripped of whitespace *except if the argument was quoted*, in which case the whitespace will be maintained. So if the following string is parsed:

```
program  --hello  " world "
```

the `value` strings will be `['my_program', '--hello', ' world ']`. This is done under the assumption that, if something is quoted, its whitespace might be meaningful.

Nested quotes are handled correctly up to arbitrary depth, with the important detail that the quotation depth (the number of escape backslashes before a quote) is reduced by 1. This is because, as the items are being split up from a string into an array, we no longer need the first layer: `argument` and `"argument with spaces"` become `['argument', 'argument with spaces']`. If the quotation marks need to be preserved, set the `preserveQuotes` option to true.

## License

MIT license

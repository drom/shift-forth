[![Build Status](https://travis-ci.org/drom/shift-forth.svg?branch=master)](https://travis-ci.org/drom/shift-forth)
[![NPM version](https://img.shields.io/npm/v/shift-forth.svg)](https://www.npmjs.org/package/shift-forth)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

# shift-forth

[DEMO](http://drom.github.io/shift-forth/editor.html)

## About

JavaScript Compiler library that takes input in [Shift-AST](https://github.com/shapesecurity/shift-spec)
format in
[SSA form](http://en.wikipedia.org/wiki/Static_single_assignment_form)
and produces
[Forth](http://en.wikipedia.org/wiki/Forth_%28programming_language%29)
program.

The library uses:
[shift-traverse-js](https://github.com/Constellation/shift-traverse-js)
library for AST traversal.

## Status

Initial code.

## Installation

```
npm install shift-forth
```

## Usage

Require Parser, Scope analyzer, and Shift-Forth.

```js
var parse = require('shift-parser').default,
    analyze = require('shift-scope').default,
    forth = require('shift-forth');
```

Parse JavaScript string, analyze scope, emit Forth string.

```js
var source, tree, scope;

source = 'function sub (a, b) { return a - b; }';
tree = parse(source);  // Shift AST
forth.naming(tree);    // add names to noname AST nodes
scope = analyze(tree); // Scoped AST
forth.dfg(scope);      // add dependency graph
forth.emit(scope);     // add Forth definition to scoped AST
console.log(scope.forth);
```

Should produce the following Forth program:

```forth
: sub - exit ;
```

## Examples

```js
function sub (a, b) {
    return a - b;
}
```

```forth
: sub - exit ;
```

## License

MIT

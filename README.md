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

### Source

```js

function add42 (a) {             // : add42 42 + exit ;
  return a + 42;
}

function square (x) {            // : square 0 pick * exit ;
  	return x * x;
}

function sub (a, b) {            // : sub - exit ;
  return a - b;
}

                                 // variable g0
function mul_global (a) {        // : mul_global g0 @ * exit ;
  return a * g0;
}

function add3_fast (a, b, c) {   // : add3_fast + + exit ;
  return b + c + a;
}

function add_var (a, b) {        // : add_var +   exit ;
  var x;
  x = a + b;
  return x;
}

function cmplx_re (a, b, c, d) { // : cmplx_re
  var re;                        //     3 pick 2 pick *
	re = a * c - b * d;          //     3 pick 2 pick * -
  return re;                     //     nip nip nip nip exit ;
}

function cmplx_im (a, b, c, d) { // : cmplx_im
  var im;                        //     3 pick *
	im = a * d + b * c;          //     2 pick 2 pick * +
  return im;                     //     nip nip nip exit ;  
}

```

## License

MIT

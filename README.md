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
function add42 (a) {
  return a + 42;
}

function sub (a, b) {
  return a - b;
}

function mul_global (a) {
  return a * g0;
}

function add3_fast (a, b, c) {
  return b + c + a;
}

function add3_slow (a, b, c) {
  return a + b + c;
}

function add_var (a, b) {
  var x;
  x = a + b;
  return x;
}

function max (a, b) {
    if (a > b) {
        return a;
    } else {
        return b;
    }
}

function max (a, b) {
    if (a > b) {
        return a;
    }
    return b;
}
```

Optimized version

```forth
variable g0
: add42 42 + exit ;
: sub - exit ;
: mul_global g0 @ * exit ;
: add3_fast + + exit ;
: add3_slow 2 pick 2 pick + + nip nip exit ;
: add_var +   exit ;
: max 1 pick 1 pick > if 1 pick exit else 1 pick exit then ;
: max 1 pick 1 pick > if 1 pick exit else 1 pick exit ;
```

Unoptimized version with comments

```forth
variable g0

: add42                ( a:$2 )
0 pick                 ( a: $2:$1 )
42                     ( a: $2:$1 $3:$1 )
+ nip                  ( $1:$0 )
exit                   ( $1:$0 )
;                      ( $1:$0 )

: sub                  ( a:$2 b:$3 )
1 pick                 ( a: b:$3 $2:$1 )
1 pick                 ( a: b: $2:$1 $3:$1 )
- nip nip              ( $1:$0 )
exit                   ( $1:$0 )
;                      ( $1:$0 )

: mul_global           ( a:$2 )
0 pick                 ( a: $2:$1 )
g0 @                   ( a: $2:$1 $3:$1 )
* nip                  ( $1:$0 )
exit                   ( $1:$0 )
;                      ( $1:$0 )

: add3_fast            ( a:$5 b:$3 c:$4 )
1 pick                 ( a:$5 b: c:$4 $3:$2 )
1 pick                 ( a:$5 b: c: $3:$2 $4:$2 )
+ nip nip              ( a:$5 $2:$1 )
1 pick                 ( a: $2:$1 $5:$1 )
+ nip                  ( $1:$0 )
exit                   ( $1:$0 )
;                      ( $1:$0 )

: add3_slow            ( a:$3 b:$4 c:$5 )
2 pick                 ( a: b:$4 c:$5 $3:$2 )
2 pick                 ( a: b: c:$5 $3:$2 $4:$2 )
+                      ( a: b: c:$5 $2:$1 )
1 pick                 ( a: b: c: $2:$1 $5:$1 )
+ nip nip nip          ( $1:$0 )
exit                   ( $1:$0 )
;                      ( $1:$0 )

: add_var              ( a:$2 b:$3 )
1 pick                 ( a: b:$3 $2:$1 )
1 pick                 ( a: b: $2:$1 $3:$1 )
+ nip nip              ( $1:x )
                       ( x:$5 )
0 pick                 ( x: $5:$4 )
nip exit               ( $5:$4 )
;                      ( $5:$4 )

: max                  ( a:$1,$4 b:$2,$6 )
1 pick                 ( a:$4 b:$2,$6 $1:$0 )
1 pick                 ( a:$4 b:$6 $1:$0 $2:$0 )
>                      ( a:$4 b:$6 $0: )
if                     ( a:$4 b:$6 )
1 pick                 ( a: b:$6 $4:$3 )
exit                   ( a: b:$6 $4:$3 )
else                   ( a: b:$6 $4:$3 )
1 pick                 ( a: b: $4:$3 $6:$5 )
exit                   ( a: b: $4:$3 $6:$5 )
then                   ( a: b: $4:$3 $6:$5 )
;                      ( a: b: $4:$3 $6:$5 )

: max                  ( a:$1,$4 b:$2,$6 )
1 pick                 ( a:$4 b:$2,$6 $1:$0 )
1 pick                 ( a:$4 b:$6 $1:$0 $2:$0 )
>                      ( a:$4 b:$6 $0: )
if                     ( a:$4 b:$6 )
1 pick                 ( a: b:$6 $4:$3 )
exit                   ( a: b:$6 $4:$3 )
else                   ( a: b:$6 $4:$3 )
1 pick                 ( a: b: $4:$3 $6:$5 )
exit                   ( a: b: $4:$3 $6:$5 )
;                      ( a: b: $4:$3 $6:$5 )
```

## License

MIT
